import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Brain, Database, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetsApi, modelsApi } from '../utils/api'
import { PageLoader } from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import clsx from 'clsx'

const ALGORITHMS = {
  classification: [
    { value: 'random_forest', label: 'Random Forest', description: 'Great all-around classifier' },
    { value: 'xgboost', label: 'XGBoost', description: 'High performance gradient boosting' },
    { value: 'logistic_regression', label: 'Logistic Regression', description: 'Simple and interpretable' },
    { value: 'gradient_boosting', label: 'Gradient Boosting', description: 'Ensemble of decision trees' },
    { value: 'svm', label: 'SVM', description: 'Support Vector Machine' },
  ],
  regression: [
    { value: 'random_forest', label: 'Random Forest', description: 'Ensemble method for regression' },
    { value: 'xgboost', label: 'XGBoost', description: 'High performance gradient boosting' },
    { value: 'linear_regression', label: 'Linear Regression', description: 'Basic linear model' },
    { value: 'gradient_boosting', label: 'Gradient Boosting', description: 'Ensemble of decision trees' },
  ],
}

export default function TrainModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    dataset_id: '',
    name: '',
    description: '',
    model_type: 'classification',
    algorithm: 'random_forest',
    target_column: '',
    feature_columns: [],
    test_size: 0.2,
    cross_validation: true,
    cv_folds: 5,
  })
  
  const { data: datasetsData, isLoading: datasetsLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list(),
  })
  
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['dataset-preview', formData.dataset_id],
    queryFn: () => datasetsApi.preview(formData.dataset_id, 5),
    enabled: !!formData.dataset_id,
  })
  
  const trainMutation = useMutation({
    mutationFn: (data) => modelsApi.train(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success('Training started! You can track progress in Models.')
      navigate(`/models/${response.data.id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Training failed to start')
    },
  })
  
  const datasets = datasetsData?.data?.datasets || []
  const columns = previewData?.data?.columns || []
  
  const selectedDataset = datasets.find(d => d.id === formData.dataset_id)
  
  const handleSubmit = () => {
    trainMutation.mutate(formData)
  }
  
  const toggleFeature = (column) => {
    setFormData(prev => ({
      ...prev,
      feature_columns: prev.feature_columns.includes(column)
        ? prev.feature_columns.filter(c => c !== column)
        : [...prev.feature_columns, column],
    }))
  }
  
  const selectAllFeatures = () => {
    const availableFeatures = columns.filter(c => c !== formData.target_column)
    setFormData(prev => ({
      ...prev,
      feature_columns: availableFeatures,
    }))
  }
  
  if (datasetsLoading) {
    return <PageLoader />
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Train New Model</h1>
        <p className="text-dark-500 mt-1">
          Configure and train a machine learning model
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= s
                  ? "bg-primary-600 text-white"
                  : "bg-dark-200 dark:bg-dark-700 text-dark-500"
              )}
            >
              {s}
            </div>
            {s < 3 && (
              <ChevronRight className="w-5 h-5 mx-2 text-dark-400" />
            )}
          </div>
        ))}
      </div>
      
      {/* Step 1: Select Dataset */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">Select Dataset</h2>
          
          {datasets.length === 0 ? (
            <Alert variant="warning" title="No datasets available">
              Please upload a dataset first before training a model.
            </Alert>
          ) : (
            <div className="grid gap-4">
              {datasets.map((dataset) => (
                <label
                  key={dataset.id}
                  className={clsx(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    formData.dataset_id === dataset.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                      : "border-dark-200 dark:border-dark-700 hover:border-primary-300"
                  )}
                >
                  <input
                    type="radio"
                    name="dataset"
                    value={dataset.id}
                    checked={formData.dataset_id === dataset.id}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dataset_id: e.target.value,
                      target_column: '',
                      feature_columns: [],
                    }))}
                    className="sr-only"
                  />
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <Database className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{dataset.name}</p>
                    <p className="text-sm text-dark-500">
                      {dataset.row_count?.toLocaleString()} rows • {dataset.column_count} columns
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.dataset_id}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Configure Model */}
      {step === 2 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">Configure Model</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="label">Model Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="e.g., Customer Churn Predictor"
                required
              />
            </div>
            
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input min-h-[80px]"
                placeholder="Describe what this model does..."
              />
            </div>
            
            <div>
              <label className="label">Model Type</label>
              <div className="grid grid-cols-2 gap-4">
                {['classification', 'regression'].map((type) => (
                  <label
                    key={type}
                    className={clsx(
                      "flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors",
                      formData.model_type === type
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                        : "border-dark-200 dark:border-dark-700 hover:border-primary-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="model_type"
                      value={type}
                      checked={formData.model_type === type}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        model_type: e.target.value,
                        algorithm: 'random_forest',
                      }))}
                      className="sr-only"
                    />
                    <span className="capitalize font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="label">Algorithm</label>
              <div className="grid gap-3">
                {ALGORITHMS[formData.model_type].map((algo) => (
                  <label
                    key={algo.value}
                    className={clsx(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      formData.algorithm === algo.value
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                        : "border-dark-200 dark:border-dark-700 hover:border-primary-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value={algo.value}
                      checked={formData.algorithm === algo.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, algorithm: e.target.value }))}
                      className="sr-only"
                    />
                    <div>
                      <p className="font-medium">{algo.label}</p>
                      <p className="text-sm text-dark-500">{algo.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.name}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Select Features */}
      {step === 3 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">Select Target & Features</h2>
          
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="spinner w-8 h-8 text-primary-600" />
            </div>
          ) : (
            <>
              <div>
                <label className="label">Target Column (what to predict)</label>
                <select
                  value={formData.target_column}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    target_column: e.target.value,
                    feature_columns: prev.feature_columns.filter(c => c !== e.target.value),
                  }))}
                  className="input"
                >
                  <option value="">Select target column...</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Feature Columns (inputs)</label>
                  <button
                    type="button"
                    onClick={selectAllFeatures}
                    className="text-sm link"
                    disabled={!formData.target_column}
                  >
                    Select all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg border-dark-200 dark:border-dark-700">
                  {columns
                    .filter(col => col !== formData.target_column)
                    .map((col) => (
                      <label
                        key={col}
                        className={clsx(
                          "flex items-center gap-2 p-2 rounded cursor-pointer",
                          formData.feature_columns.includes(col)
                            ? "bg-primary-100 dark:bg-primary-900"
                            : "hover:bg-dark-100 dark:hover:bg-dark-800"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.feature_columns.includes(col)}
                          onChange={() => toggleFeature(col)}
                          className="rounded"
                        />
                        <span className="text-sm truncate">{col}</span>
                      </label>
                    ))}
                </div>
                <p className="text-sm text-dark-500 mt-2">
                  {formData.feature_columns.length} features selected
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Test Split</label>
                  <select
                    value={formData.test_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, test_size: parseFloat(e.target.value) }))}
                    className="input"
                  >
                    <option value={0.1}>10%</option>
                    <option value={0.2}>20%</option>
                    <option value={0.3}>30%</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Cross-Validation Folds</label>
                  <select
                    value={formData.cv_folds}
                    onChange={(e) => setFormData(prev => ({ ...prev, cv_folds: parseInt(e.target.value) }))}
                    className="input"
                  >
                    <option value={3}>3 folds</option>
                    <option value={5}>5 folds</option>
                    <option value={10}>10 folds</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !formData.target_column ||
                formData.feature_columns.length === 0 ||
                trainMutation.isPending
              }
              className="btn-primary"
            >
              {trainMutation.isPending ? (
                <>
                  <span className="spinner w-4 h-4 mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Start Training
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
