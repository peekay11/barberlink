'use client'

import { useState } from 'react'
import { Search, MapPin, Scissors } from 'lucide-react'

const JHB_AREAS = [
  'Sandton', 'Rosebank', 'Braamfontein', 'Melville', 'Parkhurst',
  'Greenside', 'Randburg', 'Fourways', 'Midrand', 'Centurion'
]

const SERVICES = [
  'Haircut', 'Beard Trim', 'Hot Towel Shave', 'Hair Wash', 'Styling', 
  'Mustache Trim', 'Eyebrow Trim', 'Hair Treatment'
]

interface SearchBarProps {
  onSearch: (location: string, service: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [location, setLocation] = useState('')
  const [service, setService] = useState('')

  const handleSearch = () => {
    onSearch(location, service)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-barber-orange/20 p-3 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="flex-1 px-4 py-2 bg-gray-50 rounded-xl">
          <label className="block text-xs font-semibold text-barber-dark mb-1 flex items-center gap-1">
            <MapPin size={12} />
            Location
          </label>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              onSearch(e.target.value, service)
            }}
            className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none font-medium"
          >
            <option value="">All areas in JHB</option>
            {JHB_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 px-4 py-2 bg-gray-50 rounded-xl">
          <label className="block text-xs font-semibold text-barber-dark mb-1 flex items-center gap-1">
            <Scissors size={12} />
            Service
          </label>
          <select
            value={service}
            onChange={(e) => {
              setService(e.target.value)
              onSearch(location, e.target.value)
            }}
            className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none font-medium"
          >
            <option value="">All services</option>
            {SERVICES.map(svc => (
              <option key={svc} value={svc}>{svc}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleSearch}
          className="bg-barber-orange text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
        >
          <Search size={18} className="inline mr-2" />
          Search
        </button>
      </div>
    </div>
  )
}