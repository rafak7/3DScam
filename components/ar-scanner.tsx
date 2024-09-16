'use client'

import React, { useRef, useState, useEffect } from 'react'
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

  return (
    <div className="relative h-screen w-full">
      <Webcam className="absolute inset-0 h-full w-full object-cover" />
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
      <button
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          if (!scannedObject) {
            setIsScanning(true)
          } else {
            setScannedObject(null)
          }
        }}
      >
        {scannedObject ? 'Limpar objeto' : 'Escanear objeto'}
      </button>
    </div>
  )
}