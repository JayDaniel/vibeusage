import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { copy } from './lib/copy.js';
import './styles.css';

function ensureMetaDescription() {
  const content = copy('landing.meta.description');
  if (!content) return;

  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function ensureDocumentTitle() {
  const title = copy('landing.meta.title');
  if (!title) return;
  document.title = title;
}

ensureMetaDescription();
ensureDocumentTitle();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
