import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createProject, getProjectTemplates, updateProject, type ProjectRuntimeRow } from '../api/projects.api'
import { ProjectFormDialog } from '../components/ProjectFormDialog'

export interface ProjectsActionContextType {
  openCreateProject: () => void
  openEditProject: (project: ProjectRuntimeRow) => void
  closeAll: () => void
}

const ProjectsActionContext = createContext<ProjectsActionContextType | null>(null)

export function useProjectsActions(): ProjectsActionContextType {
  const ctx = useContext(ProjectsActionContext)
  if (!ctx) {
    return {
      openCreateProject: () => {},
      openEditProject: () => {},
      closeAll: () => {},
    }
  }
  return ctx
}

export function ProjectsActionProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectRuntimeRow | null>(null)
  const queryClient = useQueryClient()

  const { data: templates = [] } = useQuery({
    queryKey: ['project-templates'],
    queryFn: getProjectTemplates,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      toast.success('Đã tạo công trình mới')
      closeAll()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-projects'] }),
      ])
    },
    onError: () => toast.error('Không thể tạo công trình'),
  })

  const updateMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: async () => {
      toast.success('Đã cập nhật công trình')
      closeAll()
      await queryClient.invalidateQueries({ queryKey: ['projects-runtime'] })
    },
    onError: () => toast.error('Không thể cập nhật công trình'),
  })

  function openCreateProject() {
    setCreateOpen(true)
    setEditProject(null)
  }

  function openEditProject(project: ProjectRuntimeRow) {
    setEditProject(project)
    setCreateOpen(false)
  }

  function closeAll() {
    setCreateOpen(false)
    setEditProject(null)
  }

  return (
    <ProjectsActionContext.Provider
      value={{
        openCreateProject,
        openEditProject,
        closeAll,
      }}
    >
      {children}

      {createOpen ? (
        <ProjectFormDialog
          mode="create"
          open={true}
          templates={templates}
          saving={createMutation.isPending}
          error={createMutation.error}
          onClose={closeAll}
          onSubmitCreate={(payload) => createMutation.mutate(payload)}
        />
      ) : null}

      {editProject ? (
        <ProjectFormDialog
          mode="edit"
          open={true}
          project={editProject}
          templates={templates}
          saving={updateMutation.isPending}
          error={updateMutation.error}
          onClose={closeAll}
          onSubmitEdit={(id, payload) => updateMutation.mutate({ id, payload })}
        />
      ) : null}
    </ProjectsActionContext.Provider>
  )
}
