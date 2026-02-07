import { useMemo, useState } from "react";

const defaultValue = (name) => (name.includes("mean") ? 0.1 : 0.0);

export default function FeatureForm({ title, features, onSubmit, loading }) {
  const initialState = useMemo(() => {
    const values = {};
    (features || []).forEach((feature) => {
      values[feature] = defaultValue(feature);
    });
    return values;
  }, [features]);

  const [formValues, setFormValues] = useState(initialState);

  const handleChange = (feature, value) => {
    setFormValues((prev) => ({ ...prev, [feature]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  if (!features?.length) {
    return <p>Loading feature schema...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="header">
        <div>
          <h2>{title}</h2>
          <span className="badge">Live model</span>
        </div>
      </div>
      <div className="grid">
        {features.map((feature) => (
          <label key={feature} className="input-group">
            <span>{feature}</span>
            <input
              type="number"
              step="any"
              value={formValues[feature]}
              onChange={(event) => handleChange(feature, event.target.value)}
            />
          </label>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Running..." : "Predict"}
        </button>
      </div>
    </form>
  );
}
