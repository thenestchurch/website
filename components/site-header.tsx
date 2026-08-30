"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { navigation } from "@/content/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link className="brand" href="/" onClick={() => setIsOpen(false)}>
          <img alt="The Nest Church logo" src="/images/logo1.png" />
          <span className="brand-copy">
            <span>THE NEST</span>
            <span>CHURCH</span>
          </span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="site-navigation"
          aria-label="Toggle navigation"
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        <nav id="site-navigation" className={`site-nav ${isOpen ? "is-open" : ""}`} aria-label="Primary">
          <div className="nav-links">
            {navigation.map((item) => {
              const current =
                item.href === "/"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={current ? "page" : undefined}
                >
                  {item.label.toUpperCase()}
                </Link>
              );
            })}
          </div>
          
          <div className="nav-actions">
            <Link href="/admin/login" className="btn-login" onClick={() => setIsOpen(false)}>
              LOGIN
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
