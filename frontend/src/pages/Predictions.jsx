import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Brain, Play, Upload, FileText, Table2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { modelsApi, predictionsApi } from '../utils/api'
import { PageLoader } from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import clsx from 'clsx'

export default function Predictions() {
  const [searchParams] = useSearchParams()
  const initialModelId = searchParams.get('model') || ''
  
  const [selectedModel, setSelectedModel] = useState(initialModelId)
  const [inputMode, setInputMode] = useState('form') // 'form' or 'json'
  const [inputData, setInputData] = useState({})
  const [jsonInput, setJsonInput] = useState('')
  const [result, setResult] = useState(null)
  
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list({ status: 'completed' }),
  })
  
  const { data: modelData, isLoading: modelLoading } = useQuery({
    queryKey: ['model', selectedModel],
    queryFn: () => modelsApi.get(selectedModel),
    enabled: !!selectedModel,
  })
  
  const predictMutation = useMutation({
    mutationFn: ({ modelId, data }) => predictionsApi.single(modelId, data),
    onSuccess: (response) => {
      setResult(response.data)
      toast.success('Prediction completed!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Prediction failed')
    },
  })
  
  const models = modelsData?.data?.models?.filter(m => m.status === 'completed') || []
  const model = modelData?.data
  const features = model?.feature_columns || []
  
  const handlePredict = () => {
    if (!selectedModel) {
      toast.error('Please select a model')
      return
    }
    
    let data
    if (inputMode === 'json') {
      try {
        data = JSON.parse(jsonInput)
      } catch (e) {
        toast.error('Invalid JSON format')
        return
      }
    } else {
      data = inputData
    }
    
    predictMutation.mutate({ modelId: selectedModel, data })
  }
  
  const handleInputChange = (feature, value) => {
    setInputData(prev => ({
      ...prev,
      [feature]: isNaN(Number(value)) ? value : Number(value),
    }))
  }
  
  if (modelsLoading) {
    return <PageLoader />
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Make Predictions</h1>
        <p className="text-dark-500 mt-1">
          Use your trained models to make predictions on new data
        </p>
      </div>
      
      {models.length === 0 ? (
        <Alert variant="warning" title="No trained models">
          You need at least one completed model to make predictions.
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Model Selection */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Select Model</h2>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value)
                  setInputData({})
                  setResult(null)
                }}
                className="input"
              >
                <option value="">Choose a model...</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.algorithm})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Input Data */}
            {selectedModel && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Input Data</h2>
                  <div className="flex bg-dark-100 dark:bg-dark-800 rounded-lg p-1">
                    <button
                      onClick={() => setInputMode('form')}
                      className={clsx(
                        "px-3 py-1 rounded text-sm",
                        inputMode === 'form'
                          ? "bg-white dark:bg-dark-700 shadow"
                          : "text-dark-500"
                      )}
                    >
                      <Table2 className="w-4 h-4 inline mr-1" />
                      Form
                    </button>
                    <button
                      onClick={() => setInputMode('json')}
                      className={clsx(
                        "px-3 py-1 rounded text-sm",
                        inputMode === 'json'
                          ? "bg-white dark:bg-dark-700 shadow"
                          : "text-dark-500"
                      )}
                    >
                      <FileText className="w-4 h-4 inline mr-1" />
                      JSON
                    </button>
                  </div>
                </div>
                
                {modelLoading ? (
                  <div className="flex justify-center py-8">
                    <span className="spinner w-6 h-6 text-primary-600" />
                  </div>
                ) : inputMode === 'form' ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {features.map((feature) => (
                      <div key={feature}>
                        <label className="label">{feature}</label>
                        <input
                          type="text"
                          value={inputData[feature] ?? ''}
                          onChange={(e) => handleInputChange(feature, e.target.value)}
                          className="input"
                          placeholder={`Enter ${feature}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="input font-mono min-h-[200px]"
                      placeholder={`{\n  "${features[0] || 'feature1'}": 0,\n  "${features[1] || 'feature2'}": 0\n}`}
                    />
                    <p className="text-sm text-dark-500 mt-2">
                      Enter a JSON object with the feature values
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handlePredict}
                  disabled={predictMutation.isPending || !selectedModel}
                  className="btn-primary w-full mt-6"
                >
                  {predictMutation.isPending ? (
                    <>
                      <span className="spinner w-4 h-4 mr-2" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Make Prediction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Result Panel */}
          <div className="card p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Prediction Result</h2>
            
            {result ? (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 text-center">
                  <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">
                    Predicted Value
                  </p>
                  <p className="text-4xl font-bold text-primary-900 dark:text-primary-100">
                    {typeof result.prediction === 'number'
                      ? result.prediction.toFixed(4)
                      : String(result.prediction)}
                  </p>
                </div>
                
                {result.probabilities && (
                  <div>
                    <p className="text-sm font-medium mb-2">Class Probabilities</p>
                    <div className="space-y-2">
                      {Object.entries(result.probabilities).map(([cls, prob]) => (
                        <div key={cls} className="flex items-center gap-3">
                          <span className="text-sm w-24 truncate">{cls}</span>
                          <div className="flex-1 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.confidence && (
                  <div>
                    <p className="text-sm text-dark-500">Confidence</p>
                    <p className="text-lg font-medium">
                      {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Select a model and enter data to make a prediction</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
