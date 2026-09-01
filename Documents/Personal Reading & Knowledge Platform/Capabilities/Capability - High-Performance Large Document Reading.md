# Capability - High-Performance Large Document Reading

> [!summary]
> **Status:** Explored
> **Product:** [[Product - Overview]]
> **Phase:** [[Phase 1 - Local Reading Foundation]]

## Purpose

Allow users to read unusually large books and documents without performance degrading simply because the document contains a very large number of pages.

## Description

The reader should use client-side resources efficiently and avoid treating the entire document as simultaneously rendered UI. The discussion established the direction of loading and rendering only the material needed for the current viewing context, with background work and caching used where useful.

The initial concrete challenge is a PDF of approximately 15,000 pages that causes many conventional readers to crash or become sluggish.

## Why It Matters

This is the initial product wedge and a concrete user pain. It can make the product noticeably better than generic readers before the broader knowledge capabilities mature.

## Current Understanding

- The product should be browser-based.
- Heavy reading work should occur client-side where practical.
- Very large page counts should not result in proportional UI rendering/memory cost.
- Mobile devices require more conservative resource usage than desktop devices while using the same general approach.

## Scope

### In Scope

- Large-document reading.
- Efficient page loading/rendering.
- Responsive reading on desktop and mobile.
- Basic reader capabilities discussed so far, including search, bookmarking, highlighting, and content/TOC viewing.

### Deferred

Detailed rendering technology and implementation architecture.

### Out of Scope

No server-side rendering requirement has been established.

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]

## Open Questions

- Which document formats should be supported first?
- What performance targets should define success?
- How should the browser reader adapt resource usage across device classes?
