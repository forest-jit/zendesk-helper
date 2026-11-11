// Shared styles for the injected Send, Status and Save shadow roots.
// Separate from the coordinator so fields and states can be read as normal CSS.
(function (root) {
  'use strict';
  const style = `<style>
:host {
  display: block;
  font:
    14px/1.5 system-ui,
    -apple-system,
    sans-serif;
  color: var(--zdh-theme-text, #2f3941);
}
section {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  padding: 0;
  border: 0;
}
section.properties {
  display: grid;
  align-items: stretch;
}
section.properties[aria-label='Save ticket changes'] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.save-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
[hidden] {
  display: none !important;
}
button,
select {
  box-sizing: border-box;
  font: inherit;
  min-height: 32px;
  border-radius: 4px;
}
button {
  padding: 0 12px;
  border: 1px solid var(--zdh-theme-control-border, #87929d);
  background: var(--zdh-theme-surface, #fff);
  color: var(--zdh-theme-text, #2f3941);
  cursor: pointer;
}
button.primary {
  background: var(--zdh-theme-accent, #2f3941);
  border-color: var(--zdh-theme-accent, #2f3941);
  color: var(--zdh-theme-on-emphasis, #fff);
}
button:disabled {
  cursor: default;
  opacity: 0.45;
}
.status-trigger:disabled {
  opacity: 1;
  color: var(--zdh-theme-muted, #52616b);
}
button:focus-visible,
select:focus-visible {
  outline: 2px solid var(--zdh-theme-focus, #1f73b7);
  outline-offset: 2px;
}
label {
  display: grid;
  gap: 4px;
  font-weight: 600;
}
select {
  width: 100%;
  padding: 5px 12px;
  border: 1px solid var(--zdh-theme-control-border, #b0b8be);
  background: var(--zdh-theme-surface, #fff);
  color: inherit;
}
output {
  color: var(--zdh-theme-muted, #68737d);
  font-size: 12px;
}
output:empty {
  display: none;
}
.status-field {
  gap: 4px;
}
.status-field label {
  display: block;
  font: var(--zdh-native-label-font, 600 12px/20.4px system-ui);
  color: var(--zdh-theme-text, var(--zdh-native-label-color, inherit));
}
.status-field select {
  appearance: none;
  -webkit-appearance: none;
  background-image: var(
    --zdh-theme-chevron,
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%2368737d' d='M12.688 5.61a.5.5 0 01.69.718l-.066.062-5 4a.5.5 0 01-.542.054l-.082-.054-5-4a.5.5 0 01.55-.83l.074.05L8 9.359l4.688-3.75z'/%3E%3C/svg%3E")
  );
  background-repeat: no-repeat;
  background-size: 16px;
  background-position: right 12px center;
  min-width: 0;
  min-height: 0;
  height: var(--zdh-native-height, 32px);
  font: var(--zdh-native-font, 14px/21px system-ui);
  color: var(--zdh-theme-text, var(--zdh-native-color, inherit));
  background-color: var(--zdh-theme-surface, var(--zdh-native-background-color, #fff));
  border: var(--zdh-theme-input-border, var(--zdh-native-border, 1px solid #b0b8be));
  border-radius: var(--zdh-native-border-radius, 4px);
  padding: var(--zdh-native-padding, 5px 12px);
  padding-right: 36px;
  cursor: pointer;
}
.status-field select:hover {
  border-color: var(--zdh-theme-focus, #87929d);
}
.status-field select:focus-visible {
  outline: none;
  border-color: var(--zdh-theme-focus, #1f73b7);
  box-shadow: 0 0 0 2px var(--zdh-theme-border, #d8dcde);
}
.status-field .status-trigger {
  display: flex;
  align-items: center;
  text-align: left;
  width: 100%;
  height: var(--zdh-native-height, 32px);
  min-height: 0;
  font: var(--zdh-native-font, 14px/18px system-ui);
  padding: var(--zdh-native-padding, 5px 12px);
  padding-right: 36px;
  border: var(--zdh-theme-input-border, var(--zdh-native-border, 1px solid #b0b8be));
  border-radius: var(--zdh-native-border-radius, 4px);
  background-color: var(--zdh-theme-surface, var(--zdh-native-background-color, #fff));
  color: var(--zdh-theme-text, var(--zdh-native-color, inherit));
  background-image: var(
    --zdh-theme-chevron,
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%2368737d' d='M12.688 5.61a.5.5 0 01.69.718l-.066.062-5 4a.5.5 0 01-.542.054l-.082-.054-5-4a.5.5 0 01.55-.83l.074.05L8 9.359l4.688-3.75z'/%3E%3C/svg%3E")
  );
  background-repeat: no-repeat;
  background-size: 16px;
  background-position: right 12px center;
}
.status-trigger:hover {
  border-color: var(--zdh-theme-focus, #87929d);
}
.status-trigger:focus-visible,
.status-trigger[aria-expanded='true'] {
  outline: none;
  border-color: var(--zdh-theme-focus, #1f73b7);
  box-shadow: 0 0 0 2px var(--zdh-theme-border, #d8dcde);
}
[popover] {
  box-sizing: border-box;
  margin: 0;
  padding: 4px;
  position: fixed;
  inset: auto;
  border: 1px solid var(--zdh-theme-control-border, #b0b8be);
  border-radius: 4px;
  background: var(--zdh-theme-surface, #fff);
  color: var(--zdh-theme-text, #2f3941);
  box-shadow: 0 4px 12px var(--zdh-theme-shadow, rgba(0, 0, 0, 0.15));
  max-height: 240px;
  overflow: auto;
}
[popover] [role='option'] {
  display: block;
  text-align: left;
  width: 100%;
  border: 0;
  border-radius: 3px;
  min-height: 36px;
  padding: 6px 12px;
  box-shadow: none;
  background: transparent;
  color: inherit;
}
[popover] [role='option'][aria-selected='true'] {
  background: var(--zdh-theme-selected, #e9ebed);
  color: var(--zdh-theme-selected-text, #2f3941);
  font-weight: 600;
}
[popover] [role='option']:is(:hover, :focus) {
  outline: 0;
  background: var(--zdh-theme-hover, #f3f4f5);
  color: var(--zdh-theme-text, #2f3941);
}
</style>`;
  if (typeof module === 'object' && module.exports) module.exports = style;
  else root.zdhControlStyles = style;
})(globalThis);
