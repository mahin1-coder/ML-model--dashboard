// Mock data for demo mode (no backend required)

export const mockUser = {
  id: '1',
  email: 'demo@example.com',
  full_name: 'Demo User',
  is_active: true,
  created_at: new Date().toISOString(),
}

export const mockDatasets = [
  {
    id: '1',
    name: 'Customer Churn Dataset',
    description: 'Telecom customer churn prediction data',
    file_name: 'churn_data.csv',
    file_size: 2456789,
    row_count: 7043,
    column_count: 21,
    created_at: '2026-03-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'Housing Prices',
    description: 'California housing price dataset',
    file_name: 'housing.csv',
    file_size: 1234567,
    row_count: 20640,
    column_count: 10,
    created_at: '2026-03-12T14:30:00Z',
  },
  {
    id: '3',
    name: 'Iris Classification',
    description: 'Classic iris flower classification',
    file_name: 'iris.csv',
    file_size: 4500,
    row_count: 150,
    column_count: 5,
    created_at: '2026-03-15T09:00:00Z',
  },
]

export const mockModels = [
  {
    id: '1',
    name: 'Churn Predictor v1',
    description: 'Predicts customer churn probability',
    model_type: 'classification',
    algorithm: 'random_forest',
    status: 'completed',
    dataset: mockDatasets[0],
    feature_columns: ['tenure', 'MonthlyCharges', 'TotalCharges', 'Contract', 'PaymentMethod'],
    target_column: 'Churn',
    test_size: 0.2,
    cv_folds: 5,
    training_time_seconds: 12.5,
    created_at: '2026-03-11T11:00:00Z',
    metrics: {
      accuracy: 0.8234,
      precision: 0.7892,
      recall: 0.7654,
      f1: 0.7771,
      roc_auc: 0.8567,
      feature_importance: {
        'tenure': 0.32,
        'MonthlyCharges': 0.25,
        'TotalCharges': 0.18,
        'Contract': 0.15,
        'PaymentMethod': 0.10,
      },
      confusion_matrix: [[1150, 180], [210, 460]],
      class_labels: ['No Churn', 'Churn'],
      roc_curve: {
        fpr: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        tpr: [0, 0.45, 0.62, 0.73, 0.8, 0.85, 0.89, 0.93, 0.96, 0.98, 1.0],
      },
    },
  },
  {
    id: '2',
    name: 'Housing Price Model',
    description: 'Predicts median house value',
    model_type: 'regression',
    algorithm: 'xgboost',
    status: 'completed',
    dataset: mockDatasets[1],
    feature_columns: ['longitude', 'latitude', 'housing_median_age', 'total_rooms', 'median_income'],
    target_column: 'median_house_value',
    test_size: 0.2,
    cv_folds: 5,
    training_time_seconds: 8.3,
    created_at: '2026-03-13T16:00:00Z',
    metrics: {
      r2: 0.8456,
      rmse: 45678.23,
      mae: 32456.78,
      mse: 2086496789.5,
      feature_importance: {
        'median_income': 0.45,
        'longitude': 0.18,
        'latitude': 0.15,
        'housing_median_age': 0.12,
        'total_rooms': 0.10,
      },
    },
  },
  {
    id: '3',
    name: 'Iris Classifier',
    description: 'Classifies iris flower species',
    model_type: 'classification',
    algorithm: 'logistic_regression',
    status: 'training',
    dataset: mockDatasets[2],
    feature_columns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    target_column: 'species',
    test_size: 0.2,
    cv_folds: 5,
    created_at: '2026-03-16T08:00:00Z',
    metrics: null,
  },
]

export const mockSubscription = {
  tier: 'free',
  training_jobs_used: 3,
  training_jobs_limit: 5,
  is_unlimited: false,
  storage_used_mb: 3.5,
  storage_limit_mb: 100,
  start_date: '2026-03-01T00:00:00Z',
  end_date: null,
}

export const mockDatasetPreview = {
  columns: ['tenure', 'MonthlyCharges', 'TotalCharges', 'Contract', 'PaymentMethod', 'Churn'],
  data: [
    { tenure: 12, MonthlyCharges: 64.76, TotalCharges: 789.12, Contract: 'Month-to-month', PaymentMethod: 'Electronic check', Churn: 'No' },
    { tenure: 34, MonthlyCharges: 56.95, TotalCharges: 1936.30, Contract: 'One year', PaymentMethod: 'Mailed check', Churn: 'No' },
    { tenure: 2, MonthlyCharges: 53.85, TotalCharges: 107.70, Contract: 'Month-to-month', PaymentMethod: 'Electronic check', Churn: 'Yes' },
    { tenure: 45, MonthlyCharges: 42.30, TotalCharges: 1903.50, Contract: 'One year', PaymentMethod: 'Bank transfer', Churn: 'No' },
    { tenure: 8, MonthlyCharges: 70.70, TotalCharges: 565.60, Contract: 'Month-to-month', PaymentMethod: 'Credit card', Churn: 'Yes' },
  ],
  total_rows: 7043,
}

// Demo mode API handlers
export const demoApi = {
  // Auth
  login: async (email, password) => {
    await delay(500)
    if (email && password) {
      localStorage.setItem('demo_token', 'demo-jwt-token')
      return { data: { access_token: 'demo-jwt-token', refresh_token: 'demo-refresh-token' } }
    }
    throw new Error('Invalid credentials')
  },
  
  signup: async (email, password, fullName) => {
    await delay(500)
    return { data: { message: 'Account created successfully' } }
  },
  
  getMe: async () => {
    await delay(200)
    return { data: mockUser }
  },
  
  // Datasets
  listDatasets: async () => {
    await delay(300)
    return { data: { datasets: mockDatasets, total: mockDatasets.length } }
  },
  
  getDataset: async (id) => {
    await delay(200)
    return { data: mockDatasets.find(d => d.id === id) }
  },
  
  previewDataset: async (id, rows) => {
    await delay(300)
    return { data: mockDatasetPreview }
  },
  
  uploadDataset: async (file, name, description) => {
    await delay(1000)
    const newDataset = {
      id: String(mockDatasets.length + 1),
      name: name || file.name,
      description,
      file_name: file.name,
      file_size: file.size,
      row_count: Math.floor(Math.random() * 10000) + 100,
      column_count: Math.floor(Math.random() * 20) + 5,
      created_at: new Date().toISOString(),
    }
    mockDatasets.push(newDataset)
    return { data: newDataset }
  },
  
  deleteDataset: async (id) => {
    await delay(300)
    const index = mockDatasets.findIndex(d => d.id === id)
    if (index > -1) mockDatasets.splice(index, 1)
    return { data: { success: true } }
  },
  
  // Models
  listModels: async () => {
    await delay(300)
    return { data: { models: mockModels, total: mockModels.length } }
  },
  
  getModel: async (id) => {
    await delay(200)
    return { data: mockModels.find(m => m.id === id) }
  },
  
  trainModel: async (params) => {
    await delay(500)
    const newModel = {
      id: String(mockModels.length + 1),
      name: params.name,
      description: params.description,
      model_type: params.model_type,
      algorithm: params.algorithm,
      status: 'training',
      dataset: mockDatasets.find(d => d.id === params.dataset_id),
      feature_columns: params.feature_columns,
      target_column: params.target_column,
      test_size: params.test_size,
      cv_folds: params.cv_folds,
      created_at: new Date().toISOString(),
      metrics: null,
    }
    mockModels.push(newModel)
    
    // Simulate training completion after 5 seconds
    setTimeout(() => {
      newModel.status = 'completed'
      newModel.training_time_seconds = 5.2
      newModel.metrics = params.model_type === 'classification' 
        ? { accuracy: 0.89, precision: 0.87, recall: 0.85, f1: 0.86 }
        : { r2: 0.82, rmse: 12345.67, mae: 9876.54, mse: 152415667.8 }
    }, 5000)
    
    return { data: newModel }
  },
  
  deleteModel: async (id) => {
    await delay(300)
    const index = mockModels.findIndex(m => m.id === id)
    if (index > -1) mockModels.splice(index, 1)
    return { data: { success: true } }
  },
  
  // Predictions
  predict: async (modelId, inputData) => {
    await delay(500)
    const model = mockModels.find(m => m.id === modelId)
    if (model?.model_type === 'classification') {
      return {
        data: {
          prediction: 'Yes',
          probabilities: { 'No': 0.35, 'Yes': 0.65 },
          confidence: 0.65,
        }
      }
    }
    return {
      data: {
        prediction: 245678.90 + Math.random() * 50000,
        confidence: 0.82,
      }
    }
  },
  
  // Billing
  getSubscription: async () => {
    await delay(200)
    return { data: mockSubscription }
  },
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const isDemoMode = () => {
  return true // Always demo mode for now
}
