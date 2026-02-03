"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Calendar, Calculator, Activity, MapPin, Bell, TrendingDown, Download, Upload, Check, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface InjectionLog {
  id: string
  date: string
  site: string
  dose: number
  time: string
}

interface WeightEntry {
  id: string
  date: string
  weight: number
}

interface ScheduleConfig {
  day1: string
  day2: string
  time1: string
  time2: string
  doseAmount: number
}

interface AppData {
  injectionLogs: InjectionLog[]
  weightEntries: WeightEntry[]
  schedule: ScheduleConfig
  lastCalculation: {
    dilutionVolume: number
    totalMg: number
    desiredDose: number
  }
}

export default function RetatrutideTracker() {
  const [activeTab, setActiveTab] = useState('calculator')
  
  // Calculator state
  const [dilutionVolume, setDilutionVolume] = useState(1)
  const [totalMg, setTotalMg] = useState(20)
  const [desiredDose, setDesiredDose] = useState(2)
  const [calculatedVolume, setCalculatedVolume] = useState(0)
  const [concentration, setConcentration] = useState(0)
  
  // Injection site state
  const [selectedSite, setSelectedSite] = useState('')
  const [injectionAmount, setInjectionAmount] = useState('')
  const [injectionDate, setInjectionDate] = useState(new Date().toISOString().split('T')[0])
  const [injectionLogs, setInjectionLogs] = useState<InjectionLog[]>([])
  
  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    day1: 'monday',
    day2: 'thursday',
    time1: '09:00',
    time2: '09:00',
    doseAmount: 2
  })
  
  // Weight tracking state
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0])
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('retatrutideData')
    if (savedData) {
      const data: AppData = JSON.parse(savedData)
      setInjectionLogs(data.injectionLogs || [])
      setWeightEntries(data.weightEntries || [])
      setSchedule(data.schedule || schedule)
      if (data.lastCalculation) {
        setDilutionVolume(data.lastCalculation.dilutionVolume)
        setTotalMg(data.lastCalculation.totalMg)
        setDesiredDose(data.lastCalculation.desiredDose)
      }
    }
  }, [])
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    const data: AppData = {
      injectionLogs,
      weightEntries,
      schedule,
      lastCalculation: { dilutionVolume, totalMg, desiredDose }
    }
    localStorage.setItem('retatrutideData', JSON.stringify(data))
  }, [injectionLogs, weightEntries, schedule, dilutionVolume, totalMg, desiredDose])
  
  // Calculate dose volume
  useEffect(() => {
    if (dilutionVolume > 0 && totalMg > 0 && desiredDose > 0) {
      const conc = totalMg / dilutionVolume
      const volume = desiredDose / conc
      setConcentration(conc)
      setCalculatedVolume(volume)
    }
  }, [dilutionVolume, totalMg, desiredDose])
  
  // Injection site areas
  const injectionSites = [
    { id: 'abdomen-upper-right', name: 'Abdomen Upper Right', area: 'abdomen' },
    { id: 'abdomen-lower-right', name: 'Abdomen Lower Right', area: 'abdomen' },
    { id: 'abdomen-upper-left', name: 'Abdomen Upper Left', area: 'abdomen' },
    { id: 'abdomen-lower-left', name: 'Abdomen Lower Left', area: 'abdomen' }
  ]
  
  const getLastUsedDate = (siteId: string) => {
    const lastLog = injectionLogs
      .filter(log => log.site === siteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return lastLog ? new Date(lastLog.date) : null
  }
  
  const getDaysSinceLastUse = (siteId: string) => {
    const lastDate = getLastUsedDate(siteId)
    if (!lastDate) return 999
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const getRecommendedSite = () => {
    const sitesByDays = injectionSites
      .map(site => ({
        ...site,
        daysSince: getDaysSinceLastUse(site.id)
      }))
      .sort((a, b) => b.daysSince - a.daysSince)
    return sitesByDays[0]
  }
  
  const logInjection = () => {
    if (!selectedSite || !injectionAmount) return
    
    const selectedDateTime = new Date(injectionDate)
    const now = new Date()
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    
    const newLog: InjectionLog = {
      id: Date.now().toString(),
      date: selectedDateTime.toISOString(),
      site: selectedSite,
      dose: parseFloat(injectionAmount),
      time: now.toLocaleTimeString()
    }
    
    setInjectionLogs([newLog, ...injectionLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))
    setSelectedSite('')
    setInjectionAmount('')
    setInjectionDate(new Date().toISOString().split('T')[0])
  }
  
  const addWeightEntry = () => {
    if (!newWeight) return
    
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: weightDate,
      weight: parseFloat(newWeight)
    }
    
    setWeightEntries([...weightEntries, entry].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ))
    setNewWeight('')
    setWeightDate(new Date().toISOString().split('T')[0])
  }
  
  const getNextInjectionDate = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    const day1Index = daysOfWeek.indexOf(schedule.day1)
    const day2Index = daysOfWeek.indexOf(schedule.day2)
    
    let daysUntilNext = 7
    if (currentDay < day1Index) {
      daysUntilNext = day1Index - currentDay
    } else if (currentDay < day2Index) {
      daysUntilNext = day2Index - currentDay
    } else {
      daysUntilNext = 7 - currentDay + day1Index
    }
    
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysUntilNext)
    return nextDate
  }
  
  const getDaysSinceLastInjection = () => {
    if (injectionLogs.length === 0) return 0
    const lastLog = injectionLogs[0]
    const lastDate = new Date(lastLog.date)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }
  
  const getTotalWeightLost = () => {
    if (weightEntries.length < 2) return 0
    const sorted = [...weightEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return sorted[0].weight - sorted[sorted.length - 1].weight
  }
  
  const getAdherenceRate = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentLogs = injectionLogs.filter(log => 
      new Date(log.date) >= thirtyDaysAgo
    )
    
    const expectedDoses = 8
    return Math.min(100, Math.round((recentLogs.length / expectedDoses) * 100))
  }
  
  const exportData = () => {
    const data: AppData = {
      injectionLogs,
      weightEntries,
      schedule,
      lastCalculation: { dilutionVolume, totalMg, desiredDose }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retatrutide-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }
  
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data: AppData = JSON.parse(e.target?.result as string)
        setInjectionLogs(data.injectionLogs || [])
        setWeightEntries(data.weightEntries || [])
        setSchedule(data.schedule || schedule)
        if (data.lastCalculation) {
          setDilutionVolume(data.lastCalculation.dilutionVolume)
          setTotalMg(data.lastCalculation.totalMg)
          setDesiredDose(data.lastCalculation.desiredDose)
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Retatrutide Tracker</h1>
              <p className="text-blue-600">Manage your medication schedule and progress</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" asChild>
                <label>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={importData} />
                </label>
              </Button>
            </div>
          </div>
          
          {/* Dashboard Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Next Injection</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {getNextInjectionDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Days Since Last</p>
                    <p className="text-2xl font-bold text-blue-900">{getDaysSinceLastInjection()}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weight Lost</p>
                    <p className="text-2xl font-bold text-blue-900">{getTotalWeightLost().toFixed(1)} lbs</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Adherence Rate</p>
                    <p className="text-2xl font-bold text-blue-900">{getAdherenceRate()}%</p>
                  </div>
                  <Check className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="calculator">
              <Calculator className="w-4 h-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="sites">
              <MapPin className="w-4 h-4 mr-2" />
              Injection Sites
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Bell className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="progress">
              <TrendingDown className="w-4 h-4 mr-2" />
              Weight Progress
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle>Dilution Dose Calculator</CardTitle>
                <CardDescription>Calculate the correct injection volume based on your dilution concentration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dilutionVolume">Dilution Volume (mL)</Label>
                      <Input
                        id="dilutionVolume"
                        type="number"
                        value={dilutionVolume}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDilutionVolume(parseFloat(e.target.value) || 0)}
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="totalMg">Total Medication (mg)</Label>
                      <Input
                        id="totalMg"
                        type="number"
                        value={totalMg}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalMg(parseFloat(e.target.value) || 0)}
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="desiredDose">Desired Dose (mg)</Label>
                      <Input
                        id="desiredDose"
                        type="number"
                        value={desiredDose}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesiredDose(parseFloat(e.target.value) || 0)}
                        step="0.1"
                      />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-2">Quick Presets</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={() => { setDilutionVolume(1); setTotalMg(10); }}>
                          1mL / 10mg
                        </Button>
                        <Button variant="outline" onClick={() => { setDilutionVolume(1); setTotalMg(20); }}>
                          1mL / 20mg
                        </Button>
                        <Button variant="outline" onClick={() => { setDilutionVolume(1); setTotalMg(30); }}>
                          1mL / 30mg
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-lg mb-4">Calculation Results</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Concentration</p>
                          <p className="text-2xl font-bold text-blue-900">{concentration.toFixed(2)} mg/mL</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Injection Volume</p>
                          <p className="text-3xl font-bold text-blue-900">{calculatedVolume.toFixed(2)} mL</p>
                          <p className="text-lg text-blue-700">{(calculatedVolume * 100).toFixed(0)} units</p>
                        </div>
                        
                        <div className="pt-4 border-t border-blue-200">
                          <p className="text-sm text-gray-600 mb-2">Step-by-step:</p>
                          <ol className="text-sm space-y-1 list-decimal list-inside">
                            <li>Concentration: {totalMg}mg ÷ {dilutionVolume}mL = {concentration.toFixed(2)} mg/mL</li>
                            <li>Volume needed: {desiredDose}mg ÷ {concentration.toFixed(2)} mg/mL = {calculatedVolume.toFixed(2)} mL</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">Syringe Visual Guide</p>
                      <div className="bg-white rounded-lg p-4 relative h-24">
                        <div className="absolute bottom-4 left-4 right-4 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded" 
                             style={{ width: `${Math.min(calculatedVolume * 50, 100)}%` }}>
                          <span className="absolute right-2 top-1 text-white text-xs font-bold">
                            {calculatedVolume.toFixed(2)} mL
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-4 right-4 h-12 border-2 border-gray-400 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Injection Sites Tab */}
          <TabsContent value="sites">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Injection Site</CardTitle>
                  <CardDescription>Choose your injection location and log it</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Recommended Next Site</Label>
                      <div className="mt-2 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="font-semibold text-green-900">{getRecommendedSite().name}</p>
                        <p className="text-sm text-green-700">Last used {getRecommendedSite().daysSince} days ago</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="injectionDate">Injection Date</Label>
                      <Input
                        id="injectionDate"
                        type="date"
                        value={injectionDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjectionDate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="siteSelect">Choose Site</Label>
                      <Select value={selectedSite} onValueChange={setSelectedSite}>
                        <SelectTrigger id="siteSelect">
                          <SelectValue placeholder="Select injection site" />
                        </SelectTrigger>
                        <SelectContent>
                          {injectionSites.map(site => {
                            const daysSince = getDaysSinceLastUse(site.id)
                            const color = daysSince < 7 ? 'text-red-600' : daysSince < 14 ? 'text-yellow-600' : 'text-green-600'
                            return (
                              <SelectItem key={site.id} value={site.id}>
                                <span className={color}>{site.name} ({daysSince > 100 ? 'Never' : `${daysSince}d ago`})</span>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="injectionAmount">Injection Amount (mg)</Label>
                      <Input
                        id="injectionAmount"
                        type="number"
                        value={injectionAmount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjectionAmount(e.target.value)}
                        step="0.1"
                        placeholder="Enter dose amount"
                      />
                    </div>
                    
                    <Button onClick={logInjection} disabled={!selectedSite || !injectionAmount} className="w-full">
                      <Check className="w-4 h-4 mr-2" />
                      Log Injection
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Abdomen Quadrants</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {injectionSites.map(site => {
                        const daysSince = getDaysSinceLastUse(site.id)
                        const bgColor = daysSince < 7 ? 'bg-red-50 border-red-200' : daysSince < 14 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                        return (
                          <div key={site.id} className={`text-center p-3 border-2 rounded-lg ${bgColor}`}>
                            <p className="text-sm font-medium">{site.name.replace('Abdomen ', '')}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {daysSince > 100 ? 'Never used' : `${daysSince} days ago`}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Injection History</CardTitle>
                  <CardDescription>Recent injection logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {injectionLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No injections logged yet</p>
                      </div>
                    ) : (
                      injectionLogs.map(log => {
                        const site = injectionSites.find(s => s.id === log.site)
                        return (
                          <div key={log.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">{site?.name}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(log.date).toLocaleDateString()} at {log.time}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-900">{log.dose} mg</p>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setInjectionLogs(injectionLogs.filter(l => l.id !== log.id))}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Dosage Schedule Configuration</CardTitle>
                <CardDescription>Set your twice-weekly injection schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">First Injection Day</h3>
                    <div>
                      <Label htmlFor="day1">Day of Week</Label>
                      <Select value={schedule.day1} onValueChange={(value: string) => setSchedule({...schedule, day1: value})}>
                        <SelectTrigger id="day1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="time1">Time</Label>
                      <Input
                        id="time1"
                        type="time"
                        value={schedule.time1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule({...schedule, time1: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Second Injection Day</h3>
                    <div>
                      <Label htmlFor="day2">Day of Week</Label>
                      <Select value={schedule.day2} onValueChange={(value: string) => setSchedule({...schedule, day2: value})}>
                        <SelectTrigger id="day2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="time2">Time</Label>
                      <Input
                        id="time2"
                        type="time"
                        value={schedule.time2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule({...schedule, time2: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label htmlFor="doseAmount">Dose Amount per Injection (mg)</Label>
                  <Input
                    id="doseAmount"
                    type="number"
                    value={schedule.doseAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule({...schedule, doseAmount: parseFloat(e.target.value) || 0})}
                    step="0.1"
                    className="mt-2"
                  />
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Your Schedule Summary</h3>
                  <p className="text-sm">
                    You will inject <span className="font-bold">{schedule.doseAmount} mg</span> on{' '}
                    <span className="font-bold capitalize">{schedule.day1}s</span> at{' '}
                    <span className="font-bold">{schedule.time1}</span> and{' '}
                    <span className="font-bold capitalize">{schedule.day2}s</span> at{' '}
                    <span className="font-bold">{schedule.time2}</span>
                  </p>
                  <p className="text-sm mt-2 text-gray-600">
                    Total weekly dose: <span className="font-bold">{(schedule.doseAmount * 2).toFixed(1)} mg</span>
                  </p>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Upcoming Reminders</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="font-medium">Next Injection</p>
                      <p className="text-sm text-gray-600">
                        {getNextInjectionDate().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weight Progress Tab */}
          <TabsContent value="progress">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Weight Progress Chart</CardTitle>
                  <CardDescription>Track your weight loss journey over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {weightEntries.length < 2 ? (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingDown className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Add at least 2 weight entries to see your progress chart</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weightEntries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                          formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(1)} lbs`, 'Weight'] : ['', '']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  
                  {weightEntries.length >= 2 && (
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Starting Weight</p>
                        <p className="text-xl font-bold text-blue-900">
                          {weightEntries[0]?.weight.toFixed(1)} lbs
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Current Weight</p>
                        <p className="text-xl font-bold text-green-900">
                          {weightEntries[weightEntries.length - 1]?.weight.toFixed(1)} lbs
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Lost</p>
                        <p className="text-xl font-bold text-purple-900">
                          {getTotalWeightLost().toFixed(1)} lbs
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Add Weight Entry</CardTitle>
                  <CardDescription>Log your current weight</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="weightDate">Date</Label>
                      <Input
                        id="weightDate"
                        type="date"
                        value={weightDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightDate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newWeight">Weight (lbs)</Label>
                      <Input
                        id="newWeight"
                        type="number"
                        value={newWeight}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWeight(e.target.value)}
                        step="0.1"
                        placeholder="Enter weight"
                      />
                    </div>
                    
                    <Button onClick={addWeightEntry} disabled={!newWeight} className="w-full">
                      <Check className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Recent Entries</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {weightEntries.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No entries yet</p>
                      ) : (
                        [...weightEntries].reverse().map(entry => (
                          <div key={entry.id} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                            <div>
                              <p className="font-medium">{entry.weight.toFixed(1)} lbs</p>
                              <p className="text-xs text-gray-600">
                                {new Date(entry.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setWeightEntries(weightEntries.filter(e => e.id !== entry.id))}
                            >
                              Delete
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// END OF FILE