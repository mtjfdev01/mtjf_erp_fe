import React from 'react';
import { FaTools } from 'react-icons/fa';

/** Table header for the Actions column — text on desktop, centered FaTools on mobile. */
const ActionsColumnHeader = () => (
  <th className="table-actions" title="Actions">
    <span className="table-actions-label">Actions</span>
    <span className="table-actions-icon-wrap" aria-hidden>
      <FaTools className="table-actions-icon" />
    </span>
    <span className="sr-only">Actions</span>
  </th>
);

export default ActionsColumnHeader;
