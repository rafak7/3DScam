'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
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
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([])

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready()
      const loadedModel = await cocoSsd.load()
      setModel(loadedModel)
    }
    loadModel()
  }, [])

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

  const captureImage = useCallback(async () => {
    if (webcamRef.current && model) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        const img = new Image()
        img.src = imageSrc
        img.onload = async () => {
          const predictions = await model.detect(img)
          setDetectedObjects(predictions)
          setIsScanning(false)
          if (predictions.length > 0) {
            const [, , width, height] = predictions[0].bbox
            setScannedObject([width / 100, height / 100, 0.1]) // Adjust scale as needed
          }
        }
      }
    }
  }, [model])

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
      {detectedObjects.length > 0 && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded">
          {detectedObjects.map((obj, index) => (
            <p key={index}>{`${obj.class} (${Math.round(obj.score * 100)}%)`}</p>
          ))}
        </div>
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