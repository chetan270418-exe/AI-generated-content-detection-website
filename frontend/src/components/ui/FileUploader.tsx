'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, X, File as FileIcon } from 'lucide-react'

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
  supportText?: string;
}

export default function FileUploader({ 
  onFileSelect, 
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  maxSizeMB = 10,
  supportText = 'Supports JPG, PNG, WEBP'
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0]
      if (err.code === 'file-too-large') {
        setError(`File is larger than ${maxSizeMB}MB limit.`)
      } else {
        setError(`Invalid file type.`)
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0]
      setFile(selected)
      onFileSelect(selected)
      
      if (selected.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(selected)
        setPreview(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
      } else {
        setPreview(null)
      }
    }
  }, [maxSizeMB, onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false
  })

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setPreview(null)
    setError(null)
    onFileSelect(null)
  }

  if (file) {
    return (
      <div className="border border-[var(--border-color)] rounded-[12px] p-4 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {preview ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-color)] shrink-0">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FileIcon className="text-[var(--text-muted)]" />
            </div>
          )}
          <div className="truncate">
            <p className="font-medium truncate max-w-[200px] sm:max-w-[400px]">{file.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        <button 
          onClick={removeFile}
          className="p-2 hover:bg-white/10 rounded-full text-[var(--text-muted)] hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-[16px] p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-[var(--color-accent-real)] bg-[var(--color-accent-real)]/5 scale-[1.01]' : 'border-[var(--border-color)] hover:border-white/40 hover:bg-white/5'}
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Upload className={`w-8 h-8 ${isDragActive ? 'text-[var(--color-accent-real)]' : 'text-[var(--text-muted)]'}`} />
        </div>
        <p className="text-lg font-medium mb-1">
          {isDragActive ? 'Drop the file here' : 'Drag & drop or click to browse'}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {supportText} (Max {maxSizeMB}MB)
        </p>
      </div>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  )
}
