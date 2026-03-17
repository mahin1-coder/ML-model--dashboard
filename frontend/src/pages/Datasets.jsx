import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Eye, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetsApi } from '../utils/api'
import FileUpload from '../components/FileUpload'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { PageLoader } from '../components/LoadingSpinner'
import Alert from '../components/Alert'

export default function Datasets() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState(null)
  
  const queryClient = useQueryClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list(),
  })
  
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['dataset-preview', selectedDataset?.id],
    queryFn: () => datasetsApi.preview(selectedDataset.id, 20),
    enabled: !!selectedDataset && previewModalOpen,
  })
  
  const uploadMutation = useMutation({
    mutationFn: ({ file, name, description }) => datasetsApi.upload(file, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      setUploadModalOpen(false)
      toast.success('Dataset uploaded successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Upload failed')
    },
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id) => datasetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      toast.success('Dataset deleted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Delete failed')
    },
  })
  
  const handleUpload = (file, name, description) => {
    uploadMutation.mutate({ file, name, description })
  }
  
  const handlePreview = (dataset) => {
    setSelectedDataset(dataset)
    setPreviewModalOpen(true)
  }
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this dataset?')) {
      deleteMutation.mutate(id)
    }
  }
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
  
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-dark-500">{row.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'row_count',
      label: 'Rows',
      render: (value) => value?.toLocaleString() || '-',
    },
    {
      key: 'column_count',
      label: 'Columns',
    },
    {
      key: 'file_size',
      label: 'Size',
      render: (value) => formatFileSize(value),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handlePreview(row)}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]
  
  if (isLoading) {
    return <PageLoader />
  }
  
  if (error) {
    return (
      <Alert variant="error" title="Error loading datasets">
        {error.message}
      </Alert>
    )
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Datasets</h1>
          <p className="text-dark-500 mt-1">
            Manage your training datasets
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Dataset
        </button>
      </div>
      
      <div className="card">
        <DataTable
          columns={columns}
          data={data?.data?.datasets || []}
          emptyMessage="No datasets uploaded yet. Click 'Upload Dataset' to add your first dataset."
        />
      </div>
      
      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Dataset"
        size="lg"
      >
        <FileUpload
          onUpload={handleUpload}
          isLoading={uploadMutation.isPending}
        />
      </Modal>
      
      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false)
          setSelectedDataset(null)
        }}
        title={`Preview: ${selectedDataset?.name || 'Dataset'}`}
        size="xl"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner w-8 h-8 text-primary-600" />
          </div>
        ) : previewData?.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-50 dark:bg-dark-800">
                  {previewData.data.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.data.data.map((row, i) => (
                  <tr key={i} className="border-t border-dark-200 dark:border-dark-700">
                    {previewData.data.columns.map((col) => (
                      <td key={col} className="px-3 py-2">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-dark-500 mt-4">
              Showing {previewData.data.data.length} of {previewData.data.total_rows.toLocaleString()} rows
            </p>
          </div>
        ) : (
          <p className="text-dark-500">No preview available</p>
        )}
      </Modal>
    </div>
  )
}
