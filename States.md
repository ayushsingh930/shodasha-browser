# Universal UI/UX State Checklist

Use this checklist for **every feature, page, component, API request, form, and user interaction**. Not every state applies to every feature, but every applicable state must be intentionally handled.

## Data States

* Empty state
* Loading state
* Skeleton loading state
* Success state
* Partial success state
* No data available
* Data available
* Data updating
* Refreshing data
* Cached data
* Stale data

## Error States

* Generic error
* Client error (4xx)
* Server error (5xx)
* Validation error
* Permission denied
* Unauthorized
* Resource not found (404)
* Conflict state
* Timeout
* Unknown error

## Network States

* Online
* Offline
* Slow internet
* Reconnecting
* Connection restored
* Request cancelled
* Request retry

## Search & Filter States

* Initial state
* Searching
* No search results
* Filters applied
* No filtered results
* Cleared filters
* Invalid search input

## Form States

* Default
* Focused
* Filled
* Empty
* Required field missing
* Invalid input
* Valid input
* Submitting
* Submission successful
* Submission failed
* Unsaved changes
* Reset state

## Action States

* Idle
* Pending
* In progress
* Completed
* Failed
* Cancelled
* Retry available
* Confirmation required
* Undo available

## Authentication States

* Guest user
* Authenticated
* Session expired
* Logged out
* Access restricted

## Navigation States

* First visit
* Returning user
* Page loading
* Page not found
* Route unavailable
* Maintenance mode
* Redirecting

## Content States

* Content loading
* Content available
* No content
* Content unavailable
* Archived
* Deleted
* Restricted

## File States

* Ready
* Uploading
* Downloading
* Uploaded
* Downloaded
* Failed
* Cancelled
* Unsupported file
* File too large
* Corrupted file

## Feedback States

* Information
* Success
* Warning
* Error
* Confirmation
* Progress
* Notification
* Tooltip
* Empty guidance

## Accessibility States

* Keyboard navigation
* Focus visible
* Screen reader support
* Reduced motion
* High contrast compatibility

## Responsive States

* Mobile
* Tablet
* Desktop
* Large displays
* Orientation changes

## Edge Cases

* First-time use
* Returning user
* Duplicate action
* Rapid repeated clicks
* Browser refresh
* Browser back/forward
* Multiple tabs
* Expired data
* Invalid URL
* Unexpected user input

## Quality Checklist

Before considering any feature complete, verify:

* Every loading state has a completion state.
* Every success path has an error path.
* Every asynchronous operation provides user feedback.
* Every failure provides recovery or retry.
* Every destructive action requires confirmation.
* Every empty screen explains what to do next.
* Every form validates before submission.
* Every API call handles network failures gracefully.
* Every page remains usable on slow networks.
* Every interactive element provides visible feedback.
* No user action leads to a dead end.
* All applicable states are intentionally designed, implemented, and tested.
