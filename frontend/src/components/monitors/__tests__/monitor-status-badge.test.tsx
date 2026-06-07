import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MonitorStatusBadge } from "../monitor-status-badge"

describe("MonitorStatusBadge", () => {
  it('renders "Up" for up status', () => {
    render(<MonitorStatusBadge status="up" />)
    expect(screen.getByText("Up")).toBeInTheDocument()
  })

  it('renders "Down" for down status', () => {
    render(<MonitorStatusBadge status="down" />)
    expect(screen.getByText("Down")).toBeInTheDocument()
  })

  it('renders "Error" for error status', () => {
    render(<MonitorStatusBadge status="error" />)
    expect(screen.getByText("Error")).toBeInTheDocument()
  })

  it('renders "Unknown" for null status', () => {
    render(<MonitorStatusBadge status={null} />)
    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })

  it('renders "Unknown" for undefined status', () => {
    render(<MonitorStatusBadge />)
    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })
})
