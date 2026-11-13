# What changes when you fold an email?

**A quoted email is earlier correspondence copied inside one received message.** It is different from an older Zendesk message, and it may be important.

This guide describes local v0.7.12. Deployment is on hold; the Store version may show the older controls.

## A small example

Imagine one ticket message contains:

> Please investigate the billing question below.
>
> From: Support
>
> Sent: Tuesday
>
> To: Requester
>
> Subject: Billing question
>
> The earlier question, screenshots and replies…

The first sentence is the new email. Everything after the forwarded header is earlier correspondence included in that same email. It may be the only copy in Zendesk.

The helper puts **Earlier email included in this message** at a recognized boundary. It starts open:

1. Read the new message and the quoted section.
2. If you have finished with the earlier correspondence, choose **Hide quoted email**.
3. The earlier section disappears from view. A short excerpt identifies what was hidden.
4. Choose **Show quoted email** to bring the whole section back.

The helper does not delete text, compare duplicates, summarize the chain or decide that an answer is unimportant. Original links and images remain in the message. Hidden quoted text remains in the raw export. Off restores the native display.

## When is it useful?

It can reduce scrolling after you have read a long quoted section. It is less useful when the earlier correspondence is the reason the ticket exists, or when people wrote answers between quoted lines. Leave it open in those cases.

The detector recognizes explicit Gmail/Yahoo/cite wrappers and some ordered From/Sent/To/Subject forwards. Unknown structures and messages made entirely of a quote stay visible. A long email without this control is not necessarily broken: its structure may be ambiguous.

**View full conversation** is a separate control. It reveals older *ticket messages*. **Collapse earlier messages** returns to the latest five. This does not change quoting within an individual message.

## What did Simplify email formatting do?

It reset fixed widths, table spacing and background fills in one received email. It did not clean up wording or identify repeated replies. Removing widths could cause more wrapping and make the message taller. Other emails barely changed.

That was too unpredictable to present as a useful cleanup action, so **Simplify email formatting is removed in v0.7.12**. Measured unreadable-color repair remains: text with insufficient contrast against a solid background gets readable display ink. It does not flatten the whole email layout.

## Why did the banner become a thumbnail?

The old image rule was too broad. The new rule uses **displayed height**:

| Image at its normal inline size | Result |
| --- | --- |
| 71px-high decorative banner | Stays inline |
| Wide screenshot only 240px high | Stays inline |
| Screenshot taller than 320px | Compact preview; hover or click for the full image |

The threshold is 320 CSS pixels, not the file’s original pixel count. Column width and responsive sizing can change displayed height. The image itself is not cropped or altered.
