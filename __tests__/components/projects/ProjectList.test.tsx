import { render, screen } from '@testing-library/react'
import { ProjectList } from '@/components/projects/ProjectList'

const mockProjects = [
  {
    id: '1',
    name: 'Project 1',
    description: 'Description 1',
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Project 2',
    description: 'Description 2',
    status: 'active',
    createdAt: new Date(),
  },
]

describe('ProjectList', () => {
  it('should render list of projects', () => {
    render(<ProjectList projects={mockProjects} />)
    
    expect(screen.getByText('Project 1')).toBeInTheDocument()
    expect(screen.getByText('Project 2')).toBeInTheDocument()
  })

  it('should show empty state when no projects', () => {
    render(<ProjectList projects={[]} />)
    
    expect(screen.getByText(/no projects/i)).toBeInTheDocument()
  })
})
