import React from 'react';
import { MdConnectWithoutContact } from 'react-icons/md';

/** Table header for Contact — MdConnectWithoutContact icon instead of text. */
const ContactColumnHeader = () => (
  <th className="table-contact-col" title="Contact">
    <span className="table-contact-header" aria-hidden>
      <MdConnectWithoutContact className="table-contact-header__icon" />
    </span>
    <span className="sr-only">Contact</span>
  </th>
);

export default ContactColumnHeader;
