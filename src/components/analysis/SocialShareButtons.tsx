import React from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface SocialShareButtonsProps {
  url: string;
  title: string;
}

export function SocialShareButtons({ url, title }: SocialShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "𝕏",
      href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <Share2 className="h-4 w-4 text-muted-foreground" />
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
            {link.label}
          </Button>
        </a>
      ))}
    </div>
  );
}
