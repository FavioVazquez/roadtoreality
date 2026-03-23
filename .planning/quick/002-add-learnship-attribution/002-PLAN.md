# Quick Task 002 — Plan: Add Learnship Attribution to How Physics Works

**Task:** Add a subtle "Built with Learnship" credit to the How Physics Works main page footer
**Directory:** .planning/quick/002-add-learnship-attribution/

---

## Task 1: Add attribution line to Episodio4/index.html footer

<files>
- Episodio4/index.html
</files>

<action>
In the site footer (lines ~204–215), add a new `<p>` after the "Inspired by How AI Works" paragraph.
The line should read: "Built with Learnship"
Style it smaller and more faded than the rest of the footer (font-size ~0.7rem, reduced opacity)
so it reads as a quiet byline, not a headline.
</action>

<verify>
grep -n "Learnship" Episodio4/index.html
— should show the new line in the footer section
</verify>

<done>
The footer of Episodio4/index.html contains a subtle "Built with Learnship" attribution line,
visually less prominent than the existing "Inspired by How AI Works" link.
</done>
