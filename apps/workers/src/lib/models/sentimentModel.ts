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
    const output = await getClient().textClassification({
        model: "5CD-AI/Vietnamese-Sentiment-visobert",
        inputs: text,
        provider: "hf-inference",
    }); 
    // console.log(output);
    return output;
}
