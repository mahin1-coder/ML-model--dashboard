import { useEffect, useState } from "react";
import { api } from "./api";
import FeatureForm from "./components/FeatureForm";

export default function App() {
  const [metadata, setMetadata] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [regressionPrediction, setRegressionPrediction] = useState(null);
  const [classificationPrediction, setClassificationPrediction] = useState(null);
  const [loadingRegression, setLoadingRegression] = useState(false);
  const [loadingClassification, setLoadingClassification] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metadataResponse, metricsResponse] = await Promise.all([
          api.get("/metadata"),
          api.get("/metrics")
        ]);
        setMetadata(metadataResponse.data);
        setMetrics(metricsResponse.data);
      } catch (err) {
        setError("Unable to reach the API. Make sure the backend is running.");
      }
    };

    loadData();
  }, []);

  const handleRegression = async (features) => {
    setLoadingRegression(true);
    setError(null);
    try {
      const response = await api.post("/predict/regression", {
        features: normalizeFeatures(features)
      });
      setRegressionPrediction(response.data.prediction);
    } catch (err) {
      setError("Regression request failed.");
    } finally {
      setLoadingRegression(false);
    }
  };

  const handleClassification = async (features) => {
    setLoadingClassification(true);
    setError(null);
    try {
      const response = await api.post("/predict/classification", {
        features: normalizeFeatures(features)
      });
      setClassificationPrediction(response.data);
    } catch (err) {
      setError("Classification request failed.");
    } finally {
      setLoadingClassification(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>ML Model Deployment Dashboard</h1>
          <p>FastAPI + Scikit-Learn + React + Power BI export</p>
        </div>
        <span className="badge">v1.0</span>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Model metrics</h2>
        <div className="metrics">
          <div className="metric">
            <span>Regression $R^2$</span>
            <strong>{metrics?.regression?.r2?.toFixed(3) ?? "-"}</strong>
          </div>
          <div className="metric">
            <span>Regression MAE</span>
            <strong>{metrics?.regression?.mae?.toFixed(2) ?? "-"}</strong>
          </div>
          <div className="metric">
            <span>Classification Accuracy</span>
            <strong>{metrics?.classification?.accuracy?.toFixed(3) ?? "-"}</strong>
          </div>
          <div className="metric">
            <span>Classification F1</span>
            <strong>{metrics?.classification?.f1?.toFixed(3) ?? "-"}</strong>
          </div>
        </div>
      </div>

      <FeatureForm
        title="Regression prediction"
        features={metadata?.regression_features}
        onSubmit={handleRegression}
        loading={loadingRegression}
      />
      {regressionPrediction !== null && (
        <div className="card prediction">
          Predicted progression: {regressionPrediction.toFixed(2)}
        </div>
      )}

      <FeatureForm
        title="Classification prediction"
        features={metadata?.classification_features}
        onSubmit={handleClassification}
        loading={loadingClassification}
      />
      {classificationPrediction && (
        <div className="card">
          <p className="prediction">
            Predicted label: {classificationPrediction.label}
          </p>
          <p>Probability: {(classificationPrediction.probability * 100).toFixed(1)}%</p>
          <div className="metrics">
            {Object.entries(classificationPrediction.class_probabilities).map(
              ([label, prob]) => (
                <div key={label} className="metric">
                  <span>{label}</span>
                  <strong>{(prob * 100).toFixed(1)}%</strong>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const normalizeFeatures = (features) =>
  Object.fromEntries(
    Object.entries(features).map(([key, value]) => [key, Number(value)])
  );
