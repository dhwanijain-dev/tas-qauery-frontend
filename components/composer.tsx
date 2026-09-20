'use client'
import { useState, useRef } from 'react'
import { Image as ImageIcon, ArrowUp, Settings2, Upload, Scan, Database, X, Loader2, FileImage, Check } from 'lucide-react'
import { useSatQuery } from '@/components/satquery-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export function Composer() {
  const {
    query,
    setQuery,
    submitQuery,
    isAnalyzing,
    dataset,
    setDataset,
    availableDatasets,
    isUploadDialogOpen,
    setUploadDialogOpen,
    isAdvancedDialogOpen,
    setAdvancedDialogOpen,
    uploadedImages,
    addUploadedImage,
    removeUploadedImage
  } = useSatQuery()

  const [cloudCover, setCloudCover] = useState(20)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [resolution, setResolution] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => addUploadedImage(file))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleBand = (band: string) => {
    setSelectedBands((prev) =>
      prev.includes(band) ? prev.filter(b => b !== band) : [...prev, band]
    )
  }

  const allBands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']

  return (
    <>
      {/* Composer input bar */}
      <div className="composer">
        {/* BACKEND: Opens upload dialog. Files uploaded via POST /api/images/upload */}
        <button aria-label="Attach image" onClick={() => setUploadDialogOpen(true)} className="relative">
          <ImageIcon />
          {uploadedImages.length > 0 && (
            <Badge className="absolute -top-2 -right-2 px-1 py-0 text-[10px] min-w-[16px] h-4 flex items-center justify-center">
              {uploadedImages.length}
            </Badge>
          )}
        </button>
        {/* BACKEND: Submit query via POST /api/analysis/query with { query, datasetId, tool, imageIds, options } */}
        <input
          aria-label="Question about satellite image"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              submitQuery()
            }
          }}
          placeholder="Type your question about the satellite image..."
        />
        <Button variant="ghost" size="icon" aria-label="Advanced settings" onClick={() => setAdvancedDialogOpen(true)}>
          <Settings2 />
        </Button>
        <Button className="send-button" size="icon" onClick={submitQuery} aria-label="Send question" disabled={isAnalyzing || !query.trim()}>
          {isAnalyzing ? <Loader2 className="animate-spin" /> : <ArrowUp />}
        </Button>
      </div>

      {/* Action buttons below composer */}
      <div className="composer-actions">
        {/* BACKEND: Upload files to POST /api/images/upload, returns imageId for each */}
        <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
          <Upload data-icon="inline-start" className="mr-2 h-4 w-4" />Upload Image
        </Button>
        {/* BACKEND: Opens map selector. Selected area sent as GeoJSON to POST /api/analysis/area */}
        <Button variant="outline">
          <Scan data-icon="inline-start" className="mr-2 h-4 w-4" />Select Area
        </Button>

        {/* BACKEND: Datasets fetched from GET /api/datasets */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border px-4 py-2">
            <Database data-icon="inline-start" className="mr-2 h-4 w-4" />
            {dataset ? dataset.name : "Choose Dataset"}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableDatasets.map((ds) => (
              <DropdownMenuItem
                key={ds.id}
                onClick={() => {
                  /* BACKEND: Update active dataset via PUT /api/user/settings { datasetId } */
                  setDataset(ds)
                }}
              >
                {ds.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* BACKEND: Advanced params included in analysis request body */}
        <Button variant="ghost" className="advanced" onClick={() => setAdvancedDialogOpen(true)}>
          <Settings2 data-icon="inline-start" className="mr-2 h-4 w-4" />Advanced Options
        </Button>
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Satellite Image</DialogTitle>
            <DialogDescription>Upload an image for analysis. Supports GeoTIFF, PNG, JPEG formats.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div
              className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click to select or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">GeoTIFF, PNG, JPEG up to 50MB</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/png, image/jpeg, image/tiff"
                onChange={handleFileChange}
              />
            </div>
            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files</p>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {uploadedImages.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileImage className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">{Math.round(file.size / 1024)} KB</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeUploadedImage(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm">
              Cancel
            </DialogClose>
            <Button disabled={uploadedImages.length === 0} onClick={() => setUploadDialogOpen(false)}>Analyze Images</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdvancedDialogOpen} onOpenChange={setAdvancedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Analysis Options</DialogTitle>
            <DialogDescription>Configure analysis parameters for more precise results.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {/* BACKEND: cloudCoverMax param in analysis request */}
              <label className="text-sm font-medium">Cloud Cover Threshold (%)</label>
              <Input
                type="number"
                min="0" max="100"
                value={cloudCover}
                onChange={(e) => setCloudCover(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                {/* BACKEND: dateFrom, dateTo params in analysis request */}
                <label className="text-sm font-medium">Date From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Date To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              {/* BACKEND: bands[] param in analysis request */}
              <label className="text-sm font-medium">Band Selection</label>
              <div className="flex flex-wrap gap-2">
                {allBands.map((band) => (
                  <Badge
                    key={band}
                    variant={selectedBands.includes(band) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleBand(band)}
                  >
                    {selectedBands.includes(band) && <Check className="mr-1 h-3 w-3" />}
                    {band}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              {/* BACKEND: resolutionOverride param in analysis request */}
              <label className="text-sm font-medium">Resolution Override (m/px)</label>
              <Input placeholder="e.g. 10" value={resolution} onChange={(e) => setResolution(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose ><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => setAdvancedDialogOpen(false)}>Apply Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
