import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Brain, Database, Clock, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react'
import { modelsApi } from '../utils/api'
import { PageLoader } from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import FeatureImportanceChart from '../charts/FeatureImportanceChart'
import ConfusionMatrixChart from '../charts/ConfusionMatrixChart'
import ROCCurveChart from '../charts/ROCCurveChart'
import MetricsRadarChart from '../charts/MetricsRadarChart'
import clsx from 'clsx'

const statusConfig = {
  pending: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900' },
  training: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900' },
}

export default function ModelDetail() {
  const { id } = useParams()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['model', id],
    queryFn: () => modelsApi.get(id),
    refetchInterval: (data) => {
      const status = data?.data?.status
      return status === 'pending' || status === 'training' ? 3000 : false
    },
  })
  
  if (isLoading) {
    return <PageLoader />
  }
  
  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/models" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Models
        </Link>
        <Alert variant="error" title="Error loading model">
          {error.message}
        </Alert>
      </div>
    )
  }
  
  const model = data?.data
  const StatusIcon = statusConfig[model.status]?.icon || AlertCircle
  
  const isClassification = model.model_type === 'classification'
  const metrics = model.metrics || {}
  
  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/models" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-900 dark:hover:text-dark-100">
        <ArrowLeft className="w-4 h-4" />
        Back to Models
      </Link>
      
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{model.name}</h1>
              <p className="text-dark-500 mt-1">{model.description || 'No description'}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-dark-500">
                <span className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  Dataset: {model.dataset?.name || 'Unknown'}
                </span>
                <span>Algorithm: {model.algorithm}</span>
                <span>Type: {model.model_type}</span>
              </div>
            </div>
          </div>
          
          <div className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            statusConfig[model.status]?.bg
          )}>
            <StatusIcon className={clsx("w-5 h-5", statusConfig[model.status]?.color)} />
            <span className="font-medium capitalize">{model.status}</span>
          </div>
        </div>
      </div>
      
      {/* Training Progress for pending/training */}
      {(model.status === 'pending' || model.status === 'training') && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Training Progress</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full animate-pulse"
                style={{ width: model.status === 'pending' ? '10%' : '50%' }}
              />
            </div>
            <span className="text-sm text-dark-500">
              {model.status === 'pending' ? 'Queued...' : 'Training...'}
            </span>
          </div>
          <p className="text-sm text-dark-500 mt-4">
            Training started {new Date(model.created_at).toLocaleString()}
          </p>
        </div>
      )}
      
      {/* Failed Error */}
      {model.status === 'failed' && (
        <Alert variant="error" title="Training Failed">
          {model.error_message || 'An unknown error occurred during training.'}
        </Alert>
      )}
      
      {/* Completed Model Details */}
      {model.status === 'completed' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isClassification ? (
              <>
                <MetricCard label="Accuracy" value={metrics.accuracy} format="percent" />
                <MetricCard label="Precision" value={metrics.precision} format="percent" />
                <MetricCard label="Recall" value={metrics.recall} format="percent" />
                <MetricCard label="F1 Score" value={metrics.f1} format="percent" />
              </>
            ) : (
              <>
                <MetricCard label="R² Score" value={metrics.r2} format="percent" />
                <MetricCard label="RMSE" value={metrics.rmse} format="number" />
                <MetricCard label="MAE" value={metrics.mae} format="number" />
                <MetricCard label="MSE" value={metrics.mse} format="number" />
              </>
            )}
          </div>
          
          {/* Training Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Training Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-dark-500">Training Time</p>
                <p className="font-medium">{model.training_time_seconds?.toFixed(2)}s</p>
              </div>
              <div>
                <p className="text-dark-500">Test Split</p>
                <p className="font-medium">{(model.test_size * 100)}%</p>
              </div>
              <div>
                <p className="text-dark-500">CV Folds</p>
                <p className="font-medium">{model.cv_folds || 5}</p>
              </div>
              <div>
                <p className="text-dark-500">Created</p>
                <p className="font-medium">{new Date(model.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Importance */}
            {metrics.feature_importance && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Feature Importance</h2>
                <FeatureImportanceChart data={metrics.feature_importance} />
              </div>
            )}
            
            {/* Metrics Radar */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Metrics Overview</h2>
              <MetricsRadarChart 
                metrics={isClassification 
                  ? { accuracy: metrics.accuracy, precision: metrics.precision, recall: metrics.recall, f1: metrics.f1 }
                  : { r2: metrics.r2, rmse_norm: 1 - (metrics.rmse / (metrics.rmse + 1)) }
                } 
              />
            </div>
            
            {/* Confusion Matrix (Classification only) */}
            {isClassification && metrics.confusion_matrix && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Confusion Matrix</h2>
                <ConfusionMatrixChart 
                  data={metrics.confusion_matrix}
                  labels={metrics.class_labels}
                />
              </div>
            )}
            
            {/* ROC Curve (Classification only) */}
            {isClassification && metrics.roc_curve && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">ROC Curve</h2>
                <ROCCurveChart 
                  data={metrics.roc_curve}
                  auc={metrics.roc_auc}
                />
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="flex gap-4">
              <Link to={`/predictions?model=${model.id}`} className="btn-primary">
                Make Predictions
              </Link>
              <button className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Download Model
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, format }) {
  const displayValue = format === 'percent' 
    ? `${(value * 100).toFixed(2)}%`
    : typeof value === 'number'
      ? value.toFixed(4)
      : value || '-'
  
  return (
    <div className="card p-4">
      <p className="text-sm text-dark-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{displayValue}</p>
    </div>
  )
}
