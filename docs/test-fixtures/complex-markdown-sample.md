# LexiVault Round-Trip Test

This is a **complex** Markdown test file for verifying import, edit, and export round-trip integrity in LexiVault. It contains all major Markdown structural elements.

## Headings & Inline Formatting

This paragraph has **bold text**, *italic text*, ***bold-italic***, ~~strikethrough~~, and `inline code`. These should all survive the round-trip.

### Code Block

```javascript
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}
console.log(fibonacci(10)) // 55
```

## Lists

### Unordered

- Apples with a longer description to test wrapping
- Bananas
- Cherries

### Ordered

1. First, import the file
2. Second, verify rendering
3. Third, edit the content
4. Fourth, export and compare

### Task List

- [x] Verify headings are preserved
- [x] Check list rendering works
- [ ] Test table round-trip
- [ ] Verify code block preservation

## Blockquote

> This is a blockquote that spans multiple lines.
> It should be preserved during import and export.
>
> Blockquotes can even have **multiple paragraphs** with *formatting*.

## Table

| Feature | Supported | Notes |
|---------|-----------|-------|
| Headings | Yes | H1 through H3 |
| Bold/Italic | Yes | Inline formatting |
| Code blocks | Yes | Fenced with language tag |
| Lists | Yes | Ordered, unordered, task |
| Blockquotes | Yes | Multi-paragraph supported |
| Tables | This one | Alignment preserved |
| Links | [Click here](https://example.com) | Inline links |
| Images | ![LexiVault logo](https://via.placeholder.com/150) | Alt text preserved |

## Links & Images

Visit the [LexiVault project](https://github.com/example/lexivault) for more information.

Here is an inline image reference: ![Screenshot](https://via.placeholder.com/800x400?text=LexiVault+Screenshot)

## Blank Lines

This section tests blank-line preservation.

There is exactly one blank line above this paragraph.

Another paragraph follows.

---

A horizontal rule separates this final paragraph from the rest. This sentence contains a [link to test](https://example.com/test) preservation.
