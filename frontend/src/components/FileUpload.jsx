import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileSpreadsheet, Check } from 'lucide-react'
import clsx from 'clsx'

export default function FileUpload({ onUpload, isLoading }) {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      // Auto-fill name from filename
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, '')
      setName(fileName)
    }
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (file && name) {
      onUpload(file, name, description)
    }
  }
  
  const handleClear = () => {
    setFile(null)
    setName('')
    setDescription('')
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dropzone */}
      {!file ? (
        <div
          {...getRootProps()}
          className={clsx(
            "dropzone",
            isDragActive && "active"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-dark-400" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? "Drop your file here" : "Drag & drop your dataset"}
          </p>
          <p className="text-sm text-dark-500">
            or click to browse. Supports CSV, XLS, XLSX (max 100MB)
          </p>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-dark-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Form fields */}
      {file && (
        <>
          <div>
            <label htmlFor="name" className="label">
              Dataset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Enter a name for your dataset"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="label">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Describe your dataset..."
            />
          </div>
          
          <button
            type="submit"
            disabled={!name || isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <>
                <span className="spinner w-4 h-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Upload Dataset
              </>
            )}
          </button>
        </>
      )}
    </form>
  )
}
