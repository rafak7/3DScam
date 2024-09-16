'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import * as THREE from 'three';

function ScannedObject({ dimensions }: { dimensions: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <Box args={dimensions} ref={meshRef}>
      <meshStandardMaterial color="lightblue" />
    </Box>
  )
}

export function ArScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedObject, setScannedObject] = useState<[number, number, number] | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const webcamRef = useRef<Webcam>(null)

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsScanning(false)
            // Simula dimensões aleatórias para o objeto escaneado
            setScannedObject([Math.random() * 0.5 + 0.1, Math.random() * 0.5 + 0.1, Math.random() * 0.5 + 0.1])
            return 100
          }
          return prev + 10
        })
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isScanning])

  const handleCameraSwitch = useCallback(() => {
    setIsFrontCamera((prev) => !prev)
  }, [])

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      // Simples simulação de detecção de objetos
      // Em um cenário real, você usaria uma biblioteca de visão computacional
      setTimeout(() => {
        setScannedObject([Math.random() * 0.5 + 0.1, Math.random() * 0.5 + 0.1, Math.random() * 0.5 + 0.1])
        setIsScanning(false)
      }, 2000)
    }
  }, [])

  const handleScan = () => {
    if (!scannedObject) {
      setIsScanning(true)
      captureImage()
    } else {
      setScannedObject(null)
    }
  }

  return (
    <div className="relative h-screen w-full">
      <Webcam
        ref={webcamRef}
        className="absolute inset-0 h-full w-full object-cover"
        videoConstraints={{ facingMode: isFrontCamera ? 'user' : 'environment' }}
      />
      {scannedObject && (
        <Canvas className="absolute inset-0">
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ScannedObject dimensions={scannedObject} />
        </Canvas>
      )}
      {isScanning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded">
          Escaneando... {scanProgress}%
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleScan}
        >
          {scannedObject ? 'Limpar objeto' : 'Escanear objeto'}
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleCameraSwitch}
        >
          Trocar câmera
        </button>
      </div>
    </div>
  )
}