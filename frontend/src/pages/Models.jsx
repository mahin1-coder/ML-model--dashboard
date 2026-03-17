import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Brain, Trash2, Eye, Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { modelsApi } from '../utils/api'
import DataTable from '../components/DataTable'
import { PageLoader } from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import clsx from 'clsx'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  training: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function Models() {
  const queryClient = useQueryClient()
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list(),
    refetchInterval: (data) => {
      // Auto-refresh if any model is training
      const hasTraining = data?.data?.models?.some(m => 
        m.status === 'pending' || m.status === 'training'
      )
      return hasTraining ? 5000 : false
    },
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success('Model deleted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Delete failed')
    },
  })
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      deleteMutation.mutate(id)
    }
  }
  
  const columns = [
    {
      key: 'name',
      label: 'Model',
      render: (value, row) => (
        <Link to={`/models/${row.id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary-600">{value}</p>
            <p className="text-sm text-dark-500">
              {row.algorithm} • {row.model_type}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={clsx(
          "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1",
          statusStyles[value]
        )}>
          {value === 'training' && (
            <RefreshCw className="w-3 h-3 animate-spin" />
          )}
          {value}
        </span>
      ),
    },
    {
      key: 'metrics',
      label: 'Performance',
      render: (value, row) => {
        if (row.status !== 'completed' || !value) {
          return <span className="text-dark-400">-</span>
        }
        
        const mainMetric = row.model_type === 'classification'
          ? value.accuracy
          : value.r2
        
        const metricName = row.model_type === 'classification' ? 'Accuracy' : 'R²'
        
        return (
          <span className="font-medium">
            {metricName}: {(mainMetric * 100).toFixed(1)}%
          </span>
        )
      },
    },
    {
      key: 'training_time_seconds',
      label: 'Training Time',
      render: (value) => value ? `${value.toFixed(1)}s` : '-',
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
          <Link
            to={`/models/${row.id}`}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>
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
      <Alert variant="error" title="Error loading models">
        {error.message}
      </Alert>
    )
  }
  
  const hasTrainingModels = data?.data?.models?.some(m => 
    m.status === 'pending' || m.status === 'training'
  )
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Models</h1>
          <p className="text-dark-500 mt-1">
            View and manage your trained models
          </p>
        </div>
        <div className="flex gap-2">
          {hasTrainingModels && (
            <button onClick={() => refetch()} className="btn-secondary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          )}
          <Link to="/train" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Train Model
          </Link>
        </div>
      </div>
      
      {hasTrainingModels && (
        <Alert variant="info">
          Some models are currently training. The page will auto-refresh.
        </Alert>
      )}
      
      <div className="card">
        <DataTable
          columns={columns}
          data={data?.data?.models || []}
          emptyMessage="No models trained yet. Click 'Train Model' to create your first model."
        />
      </div>
    </div>
  )
}
