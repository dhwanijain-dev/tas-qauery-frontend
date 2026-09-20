'use client'

import {
  MessageCircle,
  Scan,
  Bookmark,
  Database,
  Grid2X2,
  ArrowRight,
  Menu,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useSatQuery } from '@/components/satquery-context'

/**
 * BACKEND INTEGRATION: Navigation items
 *
 * API Endpoint: GET /api/navigation
 * Response: { items: { name, icon, path, badge? }[] }
 *
 * Replace this static array with navigation fetched from your API.
 * The icon mapping can be done via a lookup table.
 */
const navItems = [
  { name: 'New Chat', Icon: MessageCircle },
  { name: 'Explore', Icon: Scan },
  { name: 'Saved Analyses', Icon: Bookmark },
  { name: 'Datasets', Icon: Database },
  { name: 'Tools', Icon: Grid2X2 },
]

/**
 * SidebarContent — Inner content shared between desktop sidebar
 * and mobile Sheet drawer. Extracted to avoid duplicating markup.
 */
function SidebarContent() {
  const { activeNav, setActiveNav, recentChats, loadChat } = useSatQuery()

  return (
    <>
      {/* Brand lockup — logo + app name */}
      <div className="brand-lockup">
        <div className="brand-mark"><span /><span /><b>+</b></div>
        <div>
          <div className="brand-name">SatQuery AI</div>
          <div className="brand-tagline">SEE&nbsp;&nbsp; UNDERSTAND&nbsp;&nbsp; ACT</div>
        </div>
      </div>

      <Separator />

      {/* Primary navigation */}
      {/* BACKEND: Navigation items can be fetched from GET /api/navigation */}
      <nav className="primary-nav" aria-label="Primary navigation">
        {navItems.map(({ name, Icon }) => (
          <Button
            key={name}
            variant="ghost"
            className={`nav-item ${activeNav === name ? 'active' : ''}`}
            onClick={() => setActiveNav(name)}
          >
            <Icon data-icon="inline-start" />
            {name}
          </Button>
        ))}
      </nav>

      <Separator />

      {/* Recent chats section */}
      {/* BACKEND: Fetch recent chats from GET /api/chats?limit=5&sort=recent */}
      <div className="recent-section">
        <div className="section-label">RECENT CHATS</div>
        <ScrollArea>
          {recentChats.map((chat) => (
            <button
              className="recent-chat"
              key={chat.id}
              onClick={() => {
                /* BACKEND: Load chat from GET /api/chats/:id */
                loadChat(chat)
              }}
            >
              <MessageCircle />
              {chat.title}
            </button>
          ))}
        </ScrollArea>
        {/* BACKEND: Navigate to full chat list or paginate GET /api/chats?page=1 */}
        <button className="view-all">View all <ArrowRight /></button>
      </div>

      <div className="sidebar-footnote">
        EARTH<br />INSIGHTS<br />FOR A BRIGHTER<br />TOMORROW
      </div>
    </>
  )
}

/**
 * LeftSidebar — Desktop sidebar with brand, navigation,
 * recent chats, and decorative footer text.
 */
export function LeftSidebar() {
  return (
    <aside className="left-sidebar">
      <SidebarContent />
    </aside>
  )
}

/**
 * MobileSidebarTrigger — Sheet-based sidebar for mobile viewports.
 * Opens as a slide-in drawer from the left containing the same
 * sidebar content as the desktop version.
 */
export function MobileSidebarTrigger() {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useSatQuery()

  return (
    <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
  <SheetTrigger>
  <Menu className="h-5 w-5" />
</SheetTrigger>
      <SheetContent side="left" className="p-0 w-[288px] border-r-0">
        <div className="left-sidebar" style={{ borderRight: 'none' }}>
          <SidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
