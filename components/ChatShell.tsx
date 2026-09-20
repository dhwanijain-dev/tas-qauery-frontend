'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSatQuery } from '@/components/satquery-context'
import { Button } from '@/components/ui/button'
import { HeroSection } from './hero-section'
import { Composer } from './composer'
import { ChatThread, type ChatMessage } from './ChatThread'

/**
 * The shape a saved conversation needs for the "RECENT CHATS" list in
 * LeftSidebar. If `recentChats` in your context already types this
 * differently, line these fields up with it — `id` and `title` are the
 * two LeftSidebar reads today.
 */
export type ChatRecord = {
  id: string
  title: string
  messages: ChatMessage[]
  datasetId?: string | null
  updatedAt: number
}

/**
 * ChatShell — top-level view switcher.
 *
 * Wherever the app currently renders <HeroSection /> + <Composer /> side by
 * side (see AppShell), render <ChatShell /> instead. It decides which view
 * to show, and now also cooperates with LeftSidebar's recent-chats list:
 *
 *   - No messages yet          -> the full HeroSection ("new chat" state)
 *   - >=1 message               -> a scrolling ChatThread of prompts/responses
 *   - "New chat" clicked        -> saves the current draft into recentChats
 *                                  (if it has at least one message), then
 *                                  clears the composer/thread back to Hero
 *   - a sidebar chat is clicked -> LeftSidebar calls context.loadChat(chat);
 *                                  ChatShell picks that up via `activeChat`
 *                                  and renders its saved transcript
 *
 * ---------------------------------------------------------------------
 * REQUIRED CONTEXT ADDITIONS (not in the SatQueryContext you've shown me)
 * ---------------------------------------------------------------------
 * `recentChats` and `loadChat(chat)` already exist. To fully wire "save
 * draft on New Chat" + "resume a saved chat", add three things to
 * SatQueryContext:
 *
 *   const [activeChat, setActiveChat] = useState<ChatRecord | null>(null)
 *
 *   function saveChatToRecents(chat: ChatRecord) {
 *     setRecentChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)].slice(0, 20))
 *     // BACKEND: POST /api/chats (new) or PATCH /api/chats/:id (existing)
 *   }
 *
 *   function loadChat(chat: ChatRecord) {
 *     setActiveChat(chat)
 *     // BACKEND: optionally GET /api/chats/:id for the full transcript if
 *     // recentChats only stores a lightweight preview, then setActiveChat(full)
 *   }
 *
 *   function startNewSession() {
 *     setActiveChat(null)
 *     // also clear sentQuery / analysisResults here if they live in this
 *     // context, so a stale result doesn't leak into the next draft
 *   }
 *
 * Expose `activeChat`, `saveChatToRecents`, and `startNewSession` from the
 * provider's value alongside the existing fields. Until then, ChatShell
 * below reads them defensively (optional chaining) so it still renders —
 * saving/loading just won't do anything yet.
 */
export function ChatShell() {
  const {
    sentQuery,
    isAnalyzing,
    analysisResults,
    setQuery,
    uploadedImages,
    removeUploadedImage,
    dataset,
    // --- new/optional fields, see context-addition note above ---
    activeChat,
    saveChatToRecents,
    startNewSession
  } = useSatQuery() as ReturnType<typeof useSatQuery> & {
    activeChat?: ChatRecord | null
    saveChatToRecents?: (chat: ChatRecord) => void
    startNewSession?: () => void
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Identifies the conversation currently on screen — either a freshly
  // generated draft id, or the id of a chat loaded from the sidebar.
  const chatIdRef = useRef<string>(`draft-${Date.now()}`)

  // Guards so we turn each sentQuery / analysisResults change into exactly
  // one chat message, not one per re-render.
  const lastSentQueryRef = useRef<string | null>(null)
  const lastResultRef = useRef<unknown>(null)

  // --- Resume a saved conversation when the sidebar loads one ---
  useEffect(() => {
    if (!activeChat) return
    setMessages(activeChat.messages)
    chatIdRef.current = activeChat.id
    lastSentQueryRef.current = null
    lastResultRef.current = null
  }, [activeChat])

  // --- Append the user's message the moment a query is actually sent ---
  useEffect(() => {
    if (!sentQuery) return
    if (sentQuery === lastSentQueryRef.current) return
    lastSentQueryRef.current = sentQuery

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: 'user',
        content: sentQuery,
        // BACKEND: if submitQuery() clears uploadedImages as part of
        // sending, snapshot the attachments *before* they're cleared
        // (e.g. have submitQuery emit { query, imageFiles } instead of
        // relying on this effect to read current context state).
        images: uploadedImages.map((file) => URL.createObjectURL(file)),
        timestamp: Date.now()
      }
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentQuery])

  // --- Append the assistant's reply once results land ---
  useEffect(() => {
    if (!analysisResults || isAnalyzing) return
    if (analysisResults === lastResultRef.current) return
    lastResultRef.current = analysisResults

    const assistantMessage: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: analysisResults.summary,
      timestamp: Date.now()
    }
    const nextMessages = [...messages, assistantMessage]
    setMessages(nextMessages)

    // Autosave-on-every-answer keeps the sidebar's recent-chats list in
    // sync as the conversation grows, not just when "New chat" is
    // clicked — mirrors how Claude/ChatGPT keep the sidebar live.
    saveChatToRecents?.({
      id: chatIdRef.current,
      title: nextMessages[0]?.content.slice(0, 60) ?? 'Untitled analysis',
      messages: nextMessages,
      datasetId: dataset?.id ?? null,
      updatedAt: Date.now()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResults, isAnalyzing])

  const hasStartedChat = messages.length > 0

  const startNewChat = () => {
    // Persist the current draft one last time before clearing, in case
    // the user hits "New chat" mid-conversation (e.g. right after their
    // own message, before a response has come back to trigger the
    // autosave above).
    if (messages.length > 0) {
      saveChatToRecents?.({
        id: chatIdRef.current,
        title: messages[0]?.content.slice(0, 60) ?? 'Untitled analysis',
        messages,
        datasetId: dataset?.id ?? null,
        updatedAt: Date.now()
      })
    }

    setMessages([])
    chatIdRef.current = `draft-${Date.now()}`
    lastSentQueryRef.current = null
    lastResultRef.current = null
    setQuery('')
    // Drop any attachments left over from the previous conversation.
    for (let i = uploadedImages.length - 1; i >= 0; i--) removeUploadedImage(i)

    // Clears `activeChat` (if a saved chat was loaded) and any
    // context-level sentQuery/analysisResults — see context-addition note.
    startNewSession?.()
  }

  return (
    <div className="chat-shell">
      {/* Only shown once a conversation exists — mirrors Claude/ChatGPT's
          "New chat" control that appears once you're inside a thread. */}
      {hasStartedChat && (
        <div className="chat-shell-topbar">
          <Button variant="ghost" size="sm" onClick={startNewChat} className="new-chat-btn">
            <Plus className="mr-1.5 h-4 w-4" />
            New chat
          </Button>
        </div>
      )}

      <div className="chat-shell-body">
        {hasStartedChat ? (
          <ChatThread messages={messages} isAnalyzing={isAnalyzing} />
        ) : (
          <HeroSection />
        )}
      </div>

      <div className="chat-shell-composer">
        <Composer />
      </div>

     <style jsx>{`
  .chat-shell {
    display: flex;
    flex-direction: column;
    /* Fills whatever height AppShell's <main className="workspace">
       gives it. If the composer ends up pinned off-screen or the
       thread doesn't scroll, check that the workspace and its
       parents up to satquery-shell resolve to a real height
       (e.g. 100dvh) rather than auto — flex children can't fill an
       auto-height parent. */
    height: 100%;
    min-height: 0;
  }

  .chat-shell-topbar {
    display: flex;
    justify-content: flex-end;
    padding: 8px 16px;
    animation: shellFadeIn 200ms ease-out;
  }

  .chat-shell-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .chat-shell-composer {
    flex-shrink: 0;
    padding: 12px 16px 20px;
  }

  @keyframes shellFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chat-shell-topbar {
      animation: none !important;
    }
  }
`}</style>
    </div>
  )
}