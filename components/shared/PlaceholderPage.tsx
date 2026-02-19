import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function PlaceholderPage({ 
  title = 'Coming Soon' 
}: { 
  title?: string 
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center">
        <CardContent className="p-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">This feature is under development.</p>
        </CardContent>
      </Card>
    </div>
  )
}
