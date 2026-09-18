import React from "react";
import PageHeader from "../common/pageHeader";

export default function ManageContactsHeader({
  eyebrow = "CONTACTS",
  title = "Manage Contacts",
  subtitle = "Add, import, and organize your contacts and groups in one place.",
  imageSrc = "/imges/layouts/newdDshboard.png",
  className = "",
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      imageSrc={imageSrc}
      className={className}
    />
  );
}
