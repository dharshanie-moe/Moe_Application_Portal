"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface SuccessPopupProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
}

export function SuccessPopup({ open, onClose, title, description }: SuccessPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
