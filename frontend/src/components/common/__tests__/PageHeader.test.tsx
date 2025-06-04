import { render, screen } from '@testing-library/react'
import PageHeader from '../PageHeader'
import React from 'react'

describe('PageHeader', () => {
  const Icon: React.FC<{ className?: string }> = ({ className }) => (
    <svg data-testid="icon" className={className}></svg>
  )

  it('renders title, icon and breadcrumb', () => {
    render(
      <PageHeader
        title="Dashboard"
        icon={Icon}
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
      />
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard')).toHaveLength(2)
  })
})
