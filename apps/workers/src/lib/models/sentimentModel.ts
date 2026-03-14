import { InferenceClient } from "@huggingface/inference";

// Lazy initialization - client will be created on first use
let client: InferenceClient | null = null;

function getClient(): InferenceClient {
    if (!client) {
        if (!process.env.HF_TOKEN) {
            throw new Error("HF_TOKEN environment variable is not set");
        }
        client = new InferenceClient(process.env.HF_TOKEN);
    }
    return client;
}

export async function sentimentModel(text: string): Promise<{ label: string; score: number }[]> {
    const client = getClient();
    // Giảm giới hạn MA_CHARS xuống 200.
    // Vì Text tiếng Việt (có dấu), các từ ghép và đặc biệt là newline (\n), emoji có thể sinh ra 
    // gấp 2-3 lần số lượng tokens so với character count. 
    // 200 ký tự sẽ đảm bảo luôn thấp hơn 514 tokens tối đa một cách tuyệt đối an toàn.
    const MAX_CHARS = 200; 

    if (text.length <= MAX_CHARS) {
        return await client.textClassification({
            model: "5CD-AI/Vietnamese-Sentiment-visobert",
            inputs: text,
            provider: "hf-inference",
        });
    }

    // Tách văn bản dài thành các đoạn nhỏ (chunks) theo khoảng trắng để không cắt ngang từ
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const word of words) {
        if ((currentChunk + " " + word).length > MAX_CHARS) {
            if (!currentChunk) {
                // Trường hợp 1 từ dài quá MAX_CHARS (hiếm gặp)
                chunks.push(word.slice(0, MAX_CHARS));
            } else {
                chunks.push(currentChunk.trim());
                currentChunk = word;
            }
        } else {
            currentChunk += (currentChunk ? " " : "") + word;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    if (chunks.length === 0) chunks.push(text.slice(0, MAX_CHARS));

    // Giới hạn số chunk tối đa để tránh vượt quá rate limit của HF API
    const processChunks = chunks.slice(0, 15);

    // Chạy phân tích song song cho tất cả các chunks
    const results = await Promise.all(
        processChunks.map((chunk) =>
            client.textClassification({
                model: "5CD-AI/Vietnamese-Sentiment-visobert",
                inputs: chunk,
                provider: "hf-inference",
            }).catch(e => {
                console.error(`Error analyzing chunk:`, e);
                return []; // Fallback to empty if a chunk fails so the whole process doesn't die.
            })
        )
    );

    // Trong ngữ cảnh kiểm duyệt MXH, nếu BẤT KỲ đoạn nào có nội dung TIÊU CỰC cao, 
    // ta nên ưu tiên chọn kết quả của đoạn tồi tệ nhất đó.
    let worstChunkResult = results.find(r => r.length > 0) || [];
    let maxNegScore = -1;

    for (const chunkResult of results) {
        if (!chunkResult || chunkResult.length === 0) continue;
        const negScore = chunkResult.find((r) => r.label === "NEG")?.score || 0;
        if (negScore > maxNegScore) {
            maxNegScore = negScore;
            worstChunkResult = chunkResult;
        }
    }

    return worstChunkResult;
}
