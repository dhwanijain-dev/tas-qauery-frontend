'use client'
import { useEffect, useRef } from 'react'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  timestamp: number
}

/**
 * ChatThread — renders the running list of prompts/responses once a
 * conversation has started (i.e. HeroSection has been replaced). Pure
 * presentation: all state lives in ChatShell.
 */
export function ChatThread({
  messages,
  isAnalyzing
}: {
  messages: ChatMessage[]
  isAnalyzing: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the latest message/typing indicator, like Claude/ChatGPT.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isAnalyzing])

  return (
    <div className="chat-thread" role="log" aria-live="polite">
      {messages.map((m) => (
        <div key={m.id} className={`chat-bubble-row ${m.role === 'user' ? 'is-user' : 'is-assistant'} bubble-in`}>
          <div className="chat-bubble">
            {m.images && m.images.length > 0 && (
              <div className="chat-bubble-images">
                {m.images.map((src, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={idx} src={src} alt="" className="chat-bubble-img" />
                ))}
              </div>
            )}
            <p>{m.content}</p>
          </div>
        </div>
      ))}

      {/* Typing / generating indicator — shown while waiting on the
          backend response for the most recent message. */}
      {isAnalyzing && (
        <div className="chat-bubble-row is-assistant bubble-in">
          <div className="chat-bubble chat-bubble-typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      <style jsx>{`
        .chat-thread {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 24px 16px 8px;
          max-width: 760px;
          margin: 0 auto;
          width: 100%;
        }

        .chat-bubble-row {
          display: flex;
        }

        .chat-bubble-row.is-user {
          justify-content: flex-end;
        }

        .chat-bubble-row.is-assistant {
          justify-content: flex-start;
        }

        .chat-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 14px;
          line-height: 1.5;
          font-size: 14px;
        }

        .chat-bubble p {
          margin: 0;
        }

        .is-user .chat-bubble {
          background: var(--primary, #111);
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .is-assistant .chat-bubble {
          background: rgba(0, 0, 0, 0.05);
          border-bottom-left-radius: 4px;
        }

        .chat-bubble-images {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .chat-bubble-img {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          object-fit: cover;
          display: block;
        }

        .chat-bubble-typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 12px 16px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.4;
          animation: typingBounce 1.1s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .bubble-in {
          animation: bubbleIn 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bubble-in,
          .typing-dot {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}