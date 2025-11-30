import React, { useLayoutEffect, useRef,useState } from "react";

interface UseTruncatedElementProps {
  ref: React.RefObject<HTMLElement | null>;
}

interface UseTruncatedElementReturn {
  isTruncated: boolean;
  isReadingMore: boolean;
  setIsReadingMore: (value: boolean) => void;
}

const useTruncatedElement = ({
  ref,
}: UseTruncatedElementProps): UseTruncatedElementReturn => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [isReadingMore, setIsReadingMore] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkTruncation = () => {
      const { offsetHeight, scrollHeight } = element;

      // Thêm buffer 1px để tránh trường hợp sai lệch do làm tròn số
      if (offsetHeight && scrollHeight && offsetHeight + 1 < scrollHeight) {
        setIsTruncated(true);
      } else {
        setIsTruncated(false);
      }
    };

    checkTruncation();

    // Thêm event listener để xử lý resize
    window.addEventListener("resize", checkTruncation);

    return () => {
      window.removeEventListener("resize", checkTruncation);
    };
  }, [ref]);

  return {
    isTruncated,
    isReadingMore,
    setIsReadingMore,
  };
};

interface NoteProps {
  content?: string;
  className?: string;
}

export default function ReadMore({ content, className = "" }: NoteProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { isTruncated, isReadingMore, setIsReadingMore } = useTruncatedElement({
    ref: ref as React.RefObject<HTMLElement | null>,
  });

  return (
    <div className={className}>
      <p
        ref={ref}
        className={`wrap-break-word text-xl ${
          !isReadingMore ? "line-clamp-3" : ""
        }`}
      >
        {content}
      </p>

      {isTruncated && !isReadingMore && (
        <button
          onClick={() => setIsReadingMore(true)}
          className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          Read more
        </button>
      )}

      {isReadingMore && isTruncated && (
        <button
          onClick={() => setIsReadingMore(false)}
          className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          Show less
        </button>
      )}
    </div>
  );
}
