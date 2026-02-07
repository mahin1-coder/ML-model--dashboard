from app.service import load_or_train_models


def main() -> None:
    regression, classification = load_or_train_models()

    sample_reg = regression.X[0]
    pred_reg = regression.model.predict([sample_reg])[0]

    sample_clf = classification.X[0]
    probs = classification.model.predict_proba([sample_clf])[0]

    print("Regression sample prediction:", float(pred_reg))
    print("Classification probabilities:", probs)


if __name__ == "__main__":
    main()
