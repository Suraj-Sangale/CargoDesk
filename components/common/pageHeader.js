import React from "react";
import CommonHeader from "./commonHeader";

export default function PageHeader({
  eyebrow = "",
  title = "Vehicle Documents",
  subtitle = "Track and manage all your vehicle documents in one place.",
  imageSrc = "/imges/layouts/newdDshboard.png",
  className = "",
  contentClassName = "",
  imageClassName = "",
}) {
  return (
    <CommonHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      className={className}
      contentClassName={contentClassName}
      rightContent={
        imageSrc ? (
          <div className="hidden md:flex items-center justify-end shrink-0 pointer-events-none select-none -my-2">
            <div
              className={`relative w-28 h-14 lg:w-68 lg:h-28 flex items-center justify-center ${imageClassName}`}
            >
              <img
                src={imageSrc}
                alt={typeof title === "string" ? title : "Dashboard Illustration"}
                className="w-full h-full object-contain drop-shadow-xs"
                loading="eager"
              />
            </div>
          </div>
        ) : null
      }
    />
  );
}
