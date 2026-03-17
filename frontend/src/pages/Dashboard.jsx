import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Database, Brain, LineChart, ArrowRight, TrendingUp } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import { PageLoader } from '../components/LoadingSpinner'
import { datasetsApi, modelsApi, billingApi } from '../utils/api'

export default function Dashboard() {
  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list({ limit: 5 }),
  })
  
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list({ limit: 5 }),
  })
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.subscription(),
  })
  
  const isLoading = datasetsLoading || modelsLoading
  
  if (isLoading) {
    return <PageLoader />
  }
  
  const stats = [
    {
      title: 'Total Datasets',
      value: datasets?.data?.total || 0,
      icon: Database,
    },
    {
      title: 'Trained Models',
      value: models?.data?.total || 0,
      icon: Brain,
    },
    {
      title: 'Training Jobs',
      value: `${subscription?.data?.training_jobs_used || 0}/${subscription?.data?.is_unlimited ? '∞' : subscription?.data?.training_jobs_limit || 5}`,
      icon: TrendingUp,
    },
    {
      title: 'Subscription',
      value: subscription?.data?.tier?.toUpperCase() || 'FREE',
      icon: LineChart,
    },
  ]
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-dark-500 mt-1">
          Monitor your ML models and datasets
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Datasets */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold">Recent Datasets</h2>
            <Link to="/datasets" className="text-sm link flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {datasets?.data?.datasets?.length > 0 ? (
              <div className="space-y-4">
                {datasets.data.datasets.slice(0, 5).map((dataset) => (
                  <div
                    key={dataset.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">{dataset.name}</p>
                        <p className="text-sm text-dark-500">
                          {dataset.row_count?.toLocaleString()} rows • {dataset.column_count} columns
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-dark-400">
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-500">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No datasets yet</p>
                <Link to="/datasets" className="link text-sm">
                  Upload your first dataset
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Models */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold">Recent Models</h2>
            <Link to="/models" className="text-sm link flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {models?.data?.models?.length > 0 ? (
              <div className="space-y-4">
                {models.data.models.slice(0, 5).map((model) => (
                  <Link
                    key={model.id}
                    to={`/models/${model.id}`}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary-600">
                          {model.name}
                        </p>
                        <p className="text-sm text-dark-500">
                          {model.algorithm} • {model.model_type}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={model.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-500">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No models yet</p>
                <Link to="/train" className="link text-sm">
                  Train your first model
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/datasets"
            className="flex items-center gap-4 p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Upload Dataset</p>
              <p className="text-sm text-dark-500">Add new training data</p>
            </div>
          </Link>
          
          <Link
            to="/train"
            className="flex items-center gap-4 p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Train Model</p>
              <p className="text-sm text-dark-500">Start a new training job</p>
            </div>
          </Link>
          
          <Link
            to="/predictions"
            className="flex items-center gap-4 p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <LineChart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Make Predictions</p>
              <p className="text-sm text-dark-500">Use your trained models</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    training: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}
