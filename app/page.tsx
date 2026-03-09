'use client';

import { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { toJpeg } from 'html-to-image';
import { Upload, ImageIcon, Wand2, Loader2, Download, Plus, X, Store } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { removeBackground } from '@imgly/background-removal';

const MOCK_MARKETPLACE_ITEMS = [
  { id: 'm1', categoryId: 'looseFurniture', name: 'Sofá Modular Cloud', brand: 'Herman Miller', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=80' },
  { id: 'm2', categoryId: 'looseFurniture', name: 'Poltrona Eames Lounge', brand: 'Herman Miller', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80' },
  { id: 'm3', categoryId: 'looseFurniture', name: 'Mesa de Jantar Saarinen', brand: 'Knoll', image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=500&q=80' },
  { id: 'm4', categoryId: 'lighting', name: 'Pendente Arco', brand: 'Flos', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&q=80' },
  { id: 'm5', categoryId: 'lighting', name: 'Luminária de Piso', brand: 'Artemide', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80' },
  { id: 'm6', categoryId: 'floorCoverings', name: 'Tapete Kilim Geométrico', brand: 'Muuto', image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=500&q=80' },
  { id: 'm7', categoryId: 'floorCoverings', name: 'Piso de Carvalho Claro', brand: 'Tarkett', image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=500&q=80' },
  { id: 'm8', categoryId: 'decorItems', name: 'Vaso de Cerâmica Orgânico', brand: 'Hay', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=500&q=80' },
  { id: 'm9', categoryId: 'stonework', name: 'Mármore Calacatta', brand: 'Portobello', image: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=500&q=80' },
  { id: 'm10', categoryId: 'plants', name: 'Ficus Lyrata', brand: 'Jardim', image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=500&q=80' },
];

const STYLES = [
  { 
    id: 'classic', 
    name: 'CLÁSSICO', 
    desc: 'Elegância atemporal, simetria, molduras e materiais nobres.',
    prompt: `Apply a classic interior design aesthetic.
Emphasize timeless elegance, symmetry, and refined proportions.
Include architectural details like crown molding, wainscoting, and baseboards.
Use noble materials such as marble, dark woods, and rich fabrics (velvet, silk).
Incorporate traditional furniture with ornate details and curved lines.
Use warm, sophisticated lighting with chandeliers or classic sconces.
Maintain a balanced, formal, and luxurious atmosphere.`
  },
  { 
    id: 'contemporary', 
    name: 'CONTEMPORÂNEO', 
    desc: 'Linhas retas, design atual, sofisticação e funcionalidade.',
    prompt: `Apply a contemporary interior design aesthetic.
Focus on current design trends, clean lines, and uncluttered spaces.
Use a neutral color palette with bold accent colors or high contrast.
Incorporate modern materials like glass, metal, and smooth stone.
Select sleek, functional furniture with geometric shapes.
Ensure abundant natural light and modern, statement lighting fixtures.
Create a sophisticated, fresh, and highly functional atmosphere.`
  },
  { 
    id: 'industrial', 
    name: 'INDUSTRIAL', 
    desc: 'Estruturas aparentes, tijolos, metal e atmosfera urbana.',
    prompt: `Apply an industrial interior design aesthetic.
Highlight raw, unfinished elements and exposed structural features.
Incorporate exposed brick walls, concrete floors, and visible ductwork or pipes.
Use materials like distressed wood, dark metal, steel, and leather.
Select robust, utilitarian furniture with a vintage or factory-inspired look.
Use warm, moody lighting with Edison bulbs or metal pendant lights.
Create an urban, edgy, and loft-like atmosphere.`
  },
  { 
    id: 'rustic', 
    name: 'RÚSTICO', 
    desc: 'Aconchego, madeira natural, pedras e texturas orgânicas.',
    prompt: `Apply a rustic interior design aesthetic.
Emphasize natural, rough, and unrefined elements.
Incorporate abundant natural wood (reclaimed or distressed), stone, and brick.
Use warm, earthy color palettes inspired by nature.
Select sturdy, comfortable furniture with a handcrafted or weathered appearance.
Include organic textures like wool, linen, and leather.
Create a warm, inviting, and cozy cabin-like atmosphere.`
  },
  { 
    id: 'boho', 
    name: 'BOHO', 
    desc: 'Estilo livre, cores quentes, plantas e mix de estampas.',
    prompt: `Apply a bohemian (boho) interior design aesthetic.
Create a relaxed, free-spirited, and highly personalized space.
Mix and match patterns, colors, and textures fearlessly.
Incorporate natural materials like rattan, wicker, macrame, and light woods.
Add abundant indoor plants and botanical elements.
Select eclectic, vintage, or globally-inspired furniture and decor.
Use soft, layered lighting and create a cozy, lived-in, and artistic atmosphere.`
  },
  { 
    id: 'clean', 
    name: 'CLEAN', 
    desc: 'Minimalismo, tons claros, muita luz natural e simplicidade.',
    prompt: `Apply a clean and minimalist interior design aesthetic.
Prioritize simplicity, functionality, and a clutter-free environment.
Use a light, airy color palette, predominantly white, soft grays, or pale pastels.
Incorporate smooth, seamless surfaces and hidden storage solutions.
Select streamlined, low-profile furniture with simple geometric forms.
Maximize natural light and use subtle, recessed, or diffused artificial lighting.
Create a calm, peaceful, and highly organized atmosphere.`
  },
];

const ROOM_TYPES = [
  { id: 'livingRoom', label: 'Sala de Estar' },
  { id: 'diningRoom', label: 'Sala de Jantar' },
  { id: 'bedroom', label: 'Quarto' },
  { id: 'kitchen', label: 'Cozinha' },
  { id: 'laundry', label: 'Lavanderia' },
  { id: 'bathroom', label: 'Banheiro' },
  { id: 'office', label: 'Escritório' },
  { id: 'outdoor', label: 'Varanda / Área Externa' },
  { id: 'hallway', label: 'Corredor' },
];

const REFERENCE_CATEGORIES = [
  { id: 'looseFurniture', label: 'Móveis Soltos' },
  { id: 'floorCoverings', label: 'Revestimento de Piso' },
  { id: 'wallCoverings', label: 'Revestimento de Parede' },
  { id: 'ceilingCoverings', label: 'Revestimento de Teto' },
  { id: 'paint', label: 'Pintura' },
  { id: 'lighting', label: 'Luminárias' },
  { id: 'stonework', label: 'Pedra (Bancada)' },
  { id: 'windowTreatments', label: 'Cortinas / Persianas' },
  { id: 'decorItems', label: 'Item de Decoração' },
  { id: 'plants', label: 'Vegetação / Plantas' },
  { id: 'people', label: 'Escala Humana' },
  { id: 'carpentry', label: 'Marcenaria' },
  { id: 'appliances', label: 'Eletrodomésticos' },
  { id: 'plumbingFixtures', label: 'Louças e Metais' },
];

const FURNITURE_CATEGORIES = ['looseFurniture', 'lighting', 'windowTreatments', 'carpentry', 'decorItems', 'appliances', 'plumbingFixtures', 'plants', 'people'];
const MATERIAL_CATEGORIES = ['floorCoverings', 'wallCoverings', 'stonework', 'paint', 'ceilingCoverings'];

const CustomLogo = ({ className, isGenerating }: { className?: string, isGenerating?: boolean }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`${className} ${isGenerating ? 'animate-pulse text-indigo-400' : ''} transition-colors duration-300`}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96L12 12.01L20.73 6.96" />
    <path d="M12 22.08V12" />
  </svg>
);

const addWatermark = (base64Image: string, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(`data:${mimeType};base64,${base64Image}`);
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Configure watermark style
      const padding = Math.max(20, img.width * 0.02);
      const fontSize = Math.max(16, img.width * 0.025);
      
      ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // Add shadow for better visibility on light backgrounds
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw text
      const text = 'ArchHUB';
      ctx.fillText(text, img.width - padding, img.height - padding);
      
      // Draw logo icon
      const iconSize = fontSize * 1.2;
      const iconX = img.width - padding - ctx.measureText(text).width - iconSize - 8;
      const iconY = img.height - padding - iconSize * 0.85;
      
      ctx.save();
      ctx.translate(iconX, iconY);
      const scale = iconSize / 24;
      ctx.scale(scale, scale);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const path1 = new Path2D("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z");
      const path2 = new Path2D("M3.27 6.96L12 12.01L20.73 6.96");
      const path3 = new Path2D("M12 22.08V12");
      
      ctx.stroke(path1);
      ctx.stroke(path2);
      ctx.stroke(path3);
      
      ctx.restore();
      
      resolve(canvas.toDataURL(mimeType, 0.95));
    };
    img.onerror = reject;
    img.src = `data:${mimeType};base64,${base64Image}`;
  });
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<'style' | 'moodboard' | 'layout' | 'build'>('style');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('1:1');
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[0].id);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0].id);
  const [decorLevel, setDecorLevel] = useState('moderate');
  const [budgetLevel, setBudgetLevel] = useState('medium');
  const [referenceImages, setReferenceImages] = useState<Record<string, { id: string, data: string, mimeType: string, instruction?: string, quantity?: number, boundingBox?: { xmin: number, ymin: number, xmax: number, ymax: number }, x?: number, y?: number, z?: number, scale?: number }[]>>({});
  const [imagineForMe, setImagineForMe] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [lightTemperature, setLightTemperature] = useState<'neutral' | 'warm' | 'cool'>('neutral');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [globalInstruction, setGlobalInstruction] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState<string | null>(null);
  const [isAddingFromMarketplace, setIsAddingFromMarketplace] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleAddFromMarketplace = async (categoryId: string, item: any) => {
    setIsAddingFromMarketplace(true);
    try {
      const response = await fetch(item.image);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newItem = {
          id: Math.random().toString(36).substring(7),
          data: base64data,
          mimeType: blob.type || 'image/jpeg',
        };
        
        setReferenceImages(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), newItem]
        }));
        setIsMarketplaceOpen(null);
        setIsAddingFromMarketplace(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Erro ao carregar imagem do marketplace:", error);
      setIsAddingFromMarketplace(false);
    }
  };
  
  // Moodboard AI State
  const [useMoodboardInRender, setUseMoodboardInRender] = useState(true);
  const [aiMoodboardImage, setAiMoodboardImage] = useState<string | null>(null);
  const [isGeneratingMoodboard, setIsGeneratingMoodboard] = useState(false);
  const [moodboardFormat, setMoodboardFormat] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('3:4');
  const [canvasBg, setCanvasBg] = useState('#f8f7f5');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const uploadCounterRef = useRef(0);
  
  // Drawing Mode State
  const [drawingModeFor, setDrawingModeFor] = useState<{ categoryId: string, imageId: string } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeWhiteBackground = async (base64: string): Promise<string> => {
    try {
      // Convert base64 to blob
      const response = await fetch(base64);
      const blob = await response.blob();
      
      // Use imgly to remove background
      const imageBlob = await removeBackground(blob);
      
      // Convert back to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
    } catch (error) {
      console.error("Error removing background:", error);
      // Fallback to original method if imgly fails
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64);
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          const tolerance = 210; 
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const isGrayscale = (max - min) < 20;
            
            if (r > tolerance && g > tolerance && b > tolerance && isGrayscale) {
              data[i + 3] = 0;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = base64;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setSelectedImageMimeType(file.type);
      setGeneratedImage(null);
      setError(null);

      // Calculate aspect ratio
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let closestRatio = '1:1';
        if (ratio > 1.5) closestRatio = '16:9';
        else if (ratio > 1.1) closestRatio = '4:3';
        else if (ratio < 0.6) closestRatio = '9:16';
        else if (ratio < 0.9) closestRatio = '3:4';
        setImageAspectRatio(closestRatio);
      };
      img.src = base64String;
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceUpload = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Only remove background for non-material categories
        const isMaterial = MATERIAL_CATEGORIES.includes(categoryId);
        const processedBase64 = isMaterial ? base64String : await removeWhiteBackground(base64String);
        
        setReferenceImages(prev => {
          const currentIndex = uploadCounterRef.current++;
          const maxZ = Math.max(0, ...Object.values(prev).flat().map(i => i.z || 0));
          
          // Center the item
          let centerX = 300;
          let centerY = 400;
          if (canvasRef.current) {
            centerX = canvasRef.current.clientWidth / 2;
            centerY = canvasRef.current.clientHeight / 2;
          }
          
          // Add a small offset so multiple items don't stack perfectly
          const offset = (currentIndex % 6) * 20;
          const startX = centerX - 100 + offset; // Assuming default item width is ~200px
          const startY = centerY - 100 + offset;
          
          // Snap to grid
          const GRID_SIZE = 20; // Smaller grid for initial placement offset
          const snappedX = Math.round(startX / GRID_SIZE) * GRID_SIZE;
          const snappedY = Math.round(startY / GRID_SIZE) * GRID_SIZE;

          return {
            ...prev,
            [categoryId]: [
              ...(prev[categoryId] || []),
              { 
                id: Math.random().toString(36).substring(7), 
                data: processedBase64, 
                mimeType: isMaterial ? file.type : 'image/png', // Keep original mime type for materials
                quantity: 1,
                x: snappedX,
                y: snappedY,
                scale: 1,
                z: maxZ + 1
              }
            ]
          };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const bringToFront = (categoryId: string, id: string) => {
    setReferenceImages(prev => {
      const maxZ = Math.max(0, ...Object.values(prev).flat().map(i => i.z || 0));
      return {
        ...prev,
        [categoryId]: prev[categoryId].map(img => 
          img.id === id ? { ...img, z: maxZ + 1 } : img
        )
      };
    });
  };

  const updateImagePosition = (categoryId: string, id: string, dx: number, dy: number) => {
    const GRID_SIZE = 80; // Invisible grid size
    
    let maxX = 1000;
    let maxY = 1000;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      maxX = rect.width - 100; // Leave some margin so it doesn't disappear completely
      maxY = rect.height - 100;
    }

    setReferenceImages(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(img => {
        if (img.id === id) {
          const newX = (img.x || 0) + dx;
          const newY = (img.y || 0) + dy;
          
          let snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
          let snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
          
          // Clamp to prevent disappearing off-screen
          snappedX = Math.max(-100, Math.min(snappedX, maxX));
          snappedY = Math.max(-100, Math.min(snappedY, maxY));
          
          return { ...img, x: snappedX, y: snappedY };
        }
        return img;
      })
    }));
  };

  const handleGenerateAIMoodboard = async () => {
    setIsGeneratingMoodboard(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });
      
      const prompt = `Create a beautiful, well-composed 2D flat design moodboard (collage style) for a ${ROOM_TYPES.find(r => r.id === roomType)?.label || 'room'} in ${STYLES.find(s => s.id === selectedStyle)?.name || 'modern'} style.
      
CRITICAL RULES - ZERO ALTERATION, NO STRETCHING, NO TEXT:
1. You MUST NOT change, modify, or hallucinate ANY furniture, lighting, or materials. 
2. ONLY use the exact images provided. IF AN ITEM OR MATERIAL IS NOT PROVIDED IN THE INPUT IMAGES, DO NOT CREATE IT. 
3. If no materials (wood, stone, floor, etc.) are provided, leave the background completely bare. DO NOT hallucinate textures, surfaces, or architectural elements.
4. PROPORTIONS & SCALING: The objects must remain EXACTLY as they appear in the input images. Materials can be scaled up or down, but you MUST maintain their original aspect ratio. DO NOT stretch, squash, or distort the proportions of any material (especially stone or wood).
5. NO PERSPECTIVE CHANGES: Do not rotate, tilt, or change the 3D perspective of the furniture. Keep them exactly as oriented in the input photos.
6. Treat the inputs as stickers or cutouts. Just remove their background and place them on the board in a visually pleasing, balanced composition.
7. NO DUPLICATION: You must use each provided image EXACTLY ONCE. Do not clone, repeat, or duplicate any item or material.
8. NO HARMONIZATION: Do not adjust lighting, shadows, or colors to match the scene. Keep the raw original pixels.
9. NO TEXT: Do not generate any text, labels, or typography on the board.

To achieve this, follow this strict rendering logic in phases:
Phase 1 (Mental Cutout): Treat every provided object as a clean cutout with a transparent background. Preserve its exact color, texture, shape, and proportions.
Phase 2 (Base): Create a minimal flat moodboard canvas with a solid background color matching ${canvasBg}. This is a flat graphic board, not a room. DO NOT add any walls, floors, or architectural elements.
Phase 3 (Materials): IF material cutouts are provided, place them on the canvas as flat swatches or background elements. You may scale them, but DO NOT stretch or distort their aspect ratio. IF NOT, skip this phase entirely. Do not invent materials.
Phase 4 (Furniture): Place the provided furniture cutouts on top of the base and materials. Allow slight shadow under the objects for depth but keep the composition flat and graphic. Do not change their perspective.
Phase 5 (Lighting/Decor): Add the lighting and decor cutouts as layered elements on top.

CRITICAL NEGATIVE CONSTRAINTS: stretched materials, distorted proportions, hallucinated materials, generated textures, fake floors, fake walls, duplicate, clone, repeat, multiple copies, twin objects, harmonization, style transfer, lighting adjustment, DO NOT change furniture color, DO NOT change material texture, DO NOT alter shapes, interior scene, living room render, staged furniture arrangement, architecture, walls, floor, ceiling, perspective environment, room render, spatial scene, generated furniture, additional decor, props, accessories, redesign, reinterpretation, stylization, text, typography, labels, logos, branding, diagrams, annotations, watermarks.`;

      const parts: any[] = [
        { text: prompt }
      ];

      Object.values(referenceImages).flat().forEach(img => {
        parts.push({
          inlineData: {
            data: img.data.split(',')[1],
            mimeType: img.mimeType
          }
        });
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          temperature: 0.2,
          imageConfig: {
            aspectRatio: moodboardFormat
          }
        }
      });

      let base64Image = null;
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (base64Image) {
        setAiMoodboardImage(`data:image/jpeg;base64,${base64Image}`);
      } else {
        throw new Error("A IA não retornou uma imagem válida.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao gerar moodboard.');
    } finally {
      setIsGeneratingMoodboard(false);
    }
  };

  const handleExportMoodboard = async () => {
    if (!canvasRef.current) return;
    try {
      setSelectedItemId(null); // Deselect to hide UI controls
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for re-render
      
      const dataUrl = await toJpeg(canvasRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        backgroundColor: canvasBg
      });
      const link = document.createElement('a');
      link.download = 'meu-moodboard.jpg';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao exportar:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    if (!canvasRef.current || !templateId) return;
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;
    
    setReferenceImages(prev => {
      const newState = { ...prev };
      
      const allItems: any[] = [];
      Object.entries(newState).forEach(([category, items]) => {
        items.forEach(item => allItems.push({ ...item, category }));
      });
      
      if (allItems.length === 0) return prev;

      const materials = allItems.filter(i => MATERIAL_CATEGORIES.includes(i.category));
      const lightings = allItems.filter(i => i.category === 'lighting');
      const furnitures = allItems.filter(i => !MATERIAL_CATEGORIES.includes(i.category) && i.category !== 'lighting');
      
      const updateItem = (id: string, category: string, updates: any) => {
        const idx = newState[category].findIndex(i => i.id === id);
        if (idx !== -1) {
          newState[category][idx] = { ...newState[category][idx], ...updates };
        }
      };

      if (templateId === 'grid') {
        const cols = Math.ceil(Math.sqrt(allItems.length));
        const rows = Math.ceil(allItems.length / cols);
        const cellW = width / cols;
        const cellH = height / rows;
        
        allItems.forEach((item, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          updateItem(item.id, item.category, {
            x: col * cellW + (cellW / 2) - 100,
            y: row * cellH + (cellH / 2) - 100,
            scale: 0.8,
            rotate: 0,
            z: index
          });
        });
      } else if (templateId === 'editorial') {
        let fIndex = 0;
        furnitures.forEach((item) => {
          if (fIndex === 0) {
            updateItem(item.id, item.category, {
              x: width / 2 - 100,
              y: height / 2 - 100,
              scale: 1.5,
              rotate: 0,
              z: 10
            });
          } else {
            updateItem(item.id, item.category, {
              x: width - 200 + (fIndex * 30),
              y: height - 200 + (fIndex * 30),
              scale: 0.7,
              rotate: 0,
              z: fIndex
            });
          }
          fIndex++;
        });
        
        materials.forEach((item, idx) => {
          updateItem(item.id, item.category, {
            x: 50,
            y: 50 + (idx * 150),
            scale: 0.6,
            rotate: 0,
            z: idx
          });
        });
        
        lightings.forEach((item, idx) => {
          updateItem(item.id, item.category, {
            x: width - 200,
            y: 50 + (idx * 150),
            scale: 0.8,
            rotate: 0,
            z: idx
          });
        });
      } else if (templateId === 'material-bottom') {
        const matY = height - 150;
        materials.forEach((item, idx) => {
          const spacing = width / (materials.length + 1);
          updateItem(item.id, item.category, {
            x: spacing * (idx + 1) - 100,
            y: matY,
            scale: 0.6,
            rotate: 0,
            z: idx
          });
        });
        
        const others = [...furnitures, ...lightings];
        if (others.length > 0) {
          const cols = Math.ceil(Math.sqrt(others.length));
          const rows = Math.ceil(others.length / cols);
          const cellW = width / cols;
          const cellH = (height - 200) / rows;
          others.forEach((item, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            updateItem(item.id, item.category, {
              x: col * cellW + (cellW / 2) - 100,
              y: row * cellH + (cellH / 2) - 100,
              scale: 0.8,
              rotate: 0,
              z: index
            });
          });
        }
      } else if (templateId === 'material-top') {
        const matY = 100;
        materials.forEach((item, idx) => {
          const spacing = width / (materials.length + 1);
          updateItem(item.id, item.category, {
            x: spacing * (idx + 1) - 100,
            y: matY,
            scale: 0.6,
            rotate: 0,
            z: idx
          });
        });
        
        const others = [...furnitures, ...lightings];
        if (others.length > 0) {
          const cols = Math.ceil(Math.sqrt(others.length));
          const rows = Math.ceil(others.length / cols);
          const cellW = width / cols;
          const cellH = (height - 250) / rows;
          others.forEach((item, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            updateItem(item.id, item.category, {
              x: col * cellW + (cellW / 2) - 100,
              y: row * cellH + (cellH / 2) + 150, // Shifted down to make room for materials
              scale: 0.8,
              rotate: 0,
              z: index
            });
          });
        }
      }

      return newState;
    });
  };

  const removeReference = (categoryId: string, idToRemove: string) => {
    setReferenceImages(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(img => img.id !== idToRemove)
    }));
  };

  const updateReferenceInstruction = (categoryId: string, idToUpdate: string, instruction: string) => {
    setReferenceImages(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(img => 
        img.id === idToUpdate ? { ...img, instruction } : img
      )
    }));
  };

  const updateReferenceQuantity = (categoryId: string, idToUpdate: string, quantity: number) => {
    if (quantity < 1) return;
    setReferenceImages(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(img => 
        img.id === idToUpdate ? { ...img, quantity } : img
      )
    }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawingModeFor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 1000;
    const y = (e.clientY - rect.top) / rect.height * 1000;
    setIsDrawing(true);
    setCurrentBox({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentBox || !drawingModeFor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, (e.clientX - rect.left) / rect.width * 1000));
    const y = Math.max(0, Math.min(1000, (e.clientY - rect.top) / rect.height * 1000));
    setCurrentBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox || !drawingModeFor) return;
    setIsDrawing(false);
    
    const xmin = Math.round(Math.min(currentBox.startX, currentBox.currentX));
    const xmax = Math.round(Math.max(currentBox.startX, currentBox.currentX));
    const ymin = Math.round(Math.min(currentBox.startY, currentBox.currentY));
    const ymax = Math.round(Math.max(currentBox.startY, currentBox.currentY));

    if (xmax - xmin > 10 && ymax - ymin > 10) {
      setReferenceImages(prev => ({
        ...prev,
        [drawingModeFor.categoryId]: prev[drawingModeFor.categoryId].map(img => 
          img.id === drawingModeFor.imageId ? { ...img, boundingBox: { xmin, ymin, xmax, ymax } } : img
        )
      }));
    }
    
    setDrawingModeFor(null);
    setCurrentBox(null);
  };

  const [environmentState, setEnvironmentState] = useState<'empty' | 'furnished' | 'keep_joinery'>('empty');
  const [generationStep, setGenerationStep] = useState<string>('');

  const handleGenerate = async () => {
    if (!selectedImage || !selectedImageMimeType) return;

    setIsGenerating(true);
    setError(null);
    setGenerationStep('Preparando imagens...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

      const furnitureRefs = Object.entries(referenceImages).filter(([id, imgs]) => FURNITURE_CATEGORIES.includes(id) && imgs.length > 0);
      const materialRefs = Object.entries(referenceImages).filter(([id, imgs]) => MATERIAL_CATEGORIES.includes(id) && imgs.length > 0);

      let currentImageBase64 = selectedImage.split(',')[1];
      let currentImageMimeType = selectedImageMimeType;

      // --- STEP 0: CLEANING ---
      if (environmentState !== 'empty') {
        setGenerationStep('Fase 0: Limpando o ambiente...');
        
        const parts0: any[] = [
          {
            inlineData: {
              data: currentImageBase64,
              mimeType: currentImageMimeType,
            },
          },
        ];

        let prompt0 = '';
        if (environmentState === 'furnished') {
          prompt0 = `Completely clear the space.
Remove all movable elements.
Eliminate furniture, decor, textiles, accessories and visual clutter.
Keep only fixed architectural elements.
Preserve spatial geometry and original camera angle.
Do not modify structure or materials.
Output an empty architectural shell of the same room.
Ultra realistic.`;
        } else if (environmentState === 'keep_joinery') {
          prompt0 = `Remove only movable furniture and decor.
Keep built-in cabinetry and fixed architectural elements.
Preserve walls, windows, doors, ceiling and flooring.
Do not alter permanent installations.
Generate an empty but architecturally intact version of the space.`;
        }

        parts0.push({ text: prompt0 });

        const response0 = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: parts0 },
          config: { imageConfig: { aspectRatio: imageAspectRatio as any } }
        });

        let foundImage0 = false;
        for (const part of response0.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            currentImageBase64 = part.inlineData.data;
            currentImageMimeType = part.inlineData.mimeType || 'image/png';
            foundImage0 = true;
            break;
          }
        }

        if (!foundImage0) {
          throw new Error('Falha na Fase 0 (Limpeza). Nenhuma imagem foi gerada.');
        }
      }

      // --- STEP 1: FURNITURE INSERTION (LAYER BY LAYER) ---
      if (furnitureRefs.length > 0) {
        // Flatten all furniture items into an array to process them sequentially
        const flatFurnitureItems: { categoryId: string, catLabel: string, img: any }[] = [];
        furnitureRefs.forEach(([categoryId, imgs]) => {
           const catLabel = REFERENCE_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
           imgs.forEach(img => {
             flatFurnitureItems.push({ categoryId, catLabel, img });
           });
        });

        for (let i = 0; i < flatFurnitureItems.length; i++) {
          const item = flatFurnitureItems[i];
          const qty = item.img.quantity || 1;
          const bbox = item.img.boundingBox;
          setGenerationStep(`Fase 1: Inserindo ${item.catLabel} (Camada ${i + 1}/${flatFurnitureItems.length})...`);
          
          const envTypeLabel = ROOM_TYPES.find(r => r.id === roomType)?.label || roomType;
          
          let itemInstruction = `ITEM TO INSERT:\nCategory: ${item.catLabel}\nQuantity: ${qty}\nUser Instruction: "${item.img.instruction || 'Place logically in the environment'}"`;
          if (bbox) {
            itemInstruction += `\nCRITICAL POSITIONING RULE: You MUST place this item EXACTLY within the bounding box coordinates [ymin, xmin, ymax, xmax]: [${bbox.ymin}, ${bbox.xmin}, ${bbox.ymax}, ${bbox.xmax}].`;
          }

          const parts1: any[] = [
            { text: `CURRENT ENVIRONMENT STATE (${envTypeLabel}) (LOCKED ARCHITECTURE):` },
            {
              inlineData: {
                data: currentImageBase64,
                mimeType: currentImageMimeType,
              },
            },
            { text: itemInstruction },
            {
              inlineData: {
                data: item.img.data.split(',')[1],
                mimeType: item.img.mimeType
              }
            }
          ];

          let prompt1 = `[PHASE 1 - LAYER ${i + 1}: ITEM INSERTION]
Act as an expert interior designer and 3D renderer.
Your ONLY task is to insert the provided ${item.catLabel} into the environment.

ENVIRONMENT TYPE: ${envTypeLabel}

=========================================
ABSOLUTE RULE: LOCK THE BASE ARCHITECTURE & CAMERA ANGLE
=========================================
- The FIRST image provided is the CURRENT ENVIRONMENT STATE. This image is 100% LOCKED.
- YOU MUST NOT alter the walls, floor plan, ceiling, windows, or doors.
- CRITICAL: The camera angle, perspective, and environment proportions MUST remain EXACTLY the same. DO NOT rotate, zoom, or shift the viewpoint.
- DO NOT change or remove any furniture that is ALREADY in the environment.
- Any hallucination of new walls or change in camera angle is a failure.

LAYOUT & QUANTITY INSTRUCTIONS:
- QUANTITY REQUIRED: EXACTLY ${qty}
`;

          if (bbox) {
            prompt1 += `- BOUNDING BOX ENFORCEMENT: You have been given bounding box coordinates [ymin, xmin, ymax, xmax]: [${bbox.ymin}, ${bbox.xmin}, ${bbox.ymax}, ${bbox.xmax}].
- You MUST draw the ${item.catLabel} inside this specific region of the image.
- Do not place it anywhere else.`;
          } else if (qty > 1) {
            prompt1 += `- CRITICAL: You MUST place ${qty} DISTINCT and SEPARATE instances of this ${item.catLabel} in the environment.
- Do not just draw one. I need to clearly see ${qty} of them.
- Arrange them logically (e.g., side-by-side, facing each other, or distributed evenly).
- Ensure each instance has correct perspective and contact shadows.`;
          } else {
            prompt1 += `- Insert EXACTLY 1 of the requested item.
- Scale and position it logically within the 3D space.
- Ground the furniture with realistic contact shadows.`;
          }

          prompt1 += `

SPATIAL AWARENESS & FUNCTIONAL LAYOUT:
- Analyze the CURRENT ENVIRONMENT STATE (${envTypeLabel}) before placing the item(s).
- Identify existing furniture, built-in cabinetry, and architectural focal points (windows, doors, pathways).
- DO NOT block existing elements. Ensure the new item(s) complement the current layout without obstructing functional areas or lines of sight.
- Create a functional and ergonomic arrangement appropriate for a ${envTypeLabel}.
- Maintain realistic circulation paths (leave adequate space to walk around and between furniture).
- Respect the scale, depth, and perspective of the environment.
- Do not hallucinate extra furniture that was not requested.`;

          if (item.categoryId === 'carpentry') {
            prompt1 += `\n\nCARPENTRY/MILLWORK SPECIFIC RULES:
Use the reference image only as inspiration for cabinetry design.
Do not copy the exact layout or dimensions.
Do not reproduce surrounding objects or lighting.
Translate the essence of the millwork design into a new adapted version.
Ensure proportional balance with the new space.
Architectural integration required.`;
          }

          if (item.categoryId === 'lighting') {
            prompt1 += `\n\nLIGHTING SPECIFIC RULES:
- Add the requested lighting fixture(s).
- DO NOT drastically change the global illumination, time of day, or exposure of the room.
- Ensure the addition of the light does NOT warp, distort, or change the room's geometry or camera angle.
- The light source should look natural but the rest of the room must remain identical.`;
          }

          if (globalInstruction.trim()) {
            prompt1 += `\n\nGLOBAL LAYOUT INSTRUCTION FROM USER:\n"${globalInstruction.trim()}"\nYou MUST respect this global instruction when placing the item(s).`;
          }

          parts1.push({ text: prompt1 });

          const response1 = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts1 },
            config: { imageConfig: { aspectRatio: imageAspectRatio as any } }
          });

          let foundImage1 = false;
          for (const part of response1.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
              currentImageBase64 = part.inlineData.data;
              currentImageMimeType = part.inlineData.mimeType || 'image/png';
              foundImage1 = true;
              break;
            }
          }

          if (!foundImage1) {
            throw new Error(`Falha na Fase 1 (Mobiliário - Camada ${i + 1}). Nenhuma imagem foi gerada.`);
          }
        }
      }

      // --- STEP 2: MATERIAL & STYLE APPLICATION ---
      if (materialRefs.length > 0 || imagineForMe) {
        setGenerationStep(furnitureRefs.length > 0 ? 'Fase 2/2: Aplicando materiais e estilo...' : 'Aplicando materiais e estilo...');
        
        const parts2: any[] = [
          {
            inlineData: {
              data: currentImageBase64,
              mimeType: currentImageMimeType,
            },
          },
        ];

        materialRefs.forEach(([categoryId, imgs]) => {
           const catLabel = REFERENCE_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
           imgs.forEach((img, index) => {
             let textPrompt = `Reference image for ${catLabel} (${index + 1}):`;
             if (img.instruction) {
               textPrompt += `\nUSER INSTRUCTION FOR THIS MATERIAL: "${img.instruction}"`;
             }
             parts2.push({ text: textPrompt });
             parts2.push({
               inlineData: {
                 data: img.data.split(',')[1],
                 mimeType: img.mimeType
               }
             });
           });
        });

        const uploadedMaterialTypes = materialRefs.map(([id]) => REFERENCE_CATEGORIES.find(c => c.id === id)?.label).join(', ');

        let prompt2 = `[PHASE 2: MATERIAL & STYLE REFINEMENT]
Act as an expert interior designer and 3D renderer.
Your task is to update the materials and style of the provided image.

ROOM TYPE: ${ROOM_TYPES.find(r => r.id === roomType)?.label || roomType}

STRUCTURE PRESERVATION RULES:
The architectural structure must remain exactly the same.
Do NOT:
- Change camera position, angle, zoom or framing.
- Modify room proportions or perspective.
- Move, remove or resize walls, floor, ceiling, doors or windows.
`;

        if (furnitureRefs.length > 0) {
          prompt2 += `
FURNITURE PRESERVATION RULES:
- The existing furniture in the image (inserted in Phase 1) is already correct and MUST NOT be changed.
- Do NOT alter, move, or remove any furniture or objects currently in the room.
`;
        }

        if (materialRefs.length > 0) {
          prompt2 += `
MATERIAL MODIFICATION ACTIVATED:
Only modify the following surfaces that have explicit material references:
${uploadedMaterialTypes}

Rules:
- Replace surface finish only.
- Preserve original geometry and thickness.
- Maintain perspective and lighting direction.
- Do not modify surfaces without uploaded reference.
- Do not create new materials.
`;
        }

        if (imagineForMe) {
          const styleObj = STYLES.find(s => s.id === selectedStyle);
          prompt2 += `
CREATIVE MODE ACTIVATED:
Apply the following design style while preserving structural geometry and camera position:

${styleObj?.prompt || selectedStyle}

FURNITURE INSTRUCTIONS:
- If the room lacks furniture, you MUST furnish it according to the selected style.
- IMPORTANT: When generating or suggesting furniture, ONLY use real, existing furniture models from actual high-end brands (e.g., Herman Miller, Knoll, Cassina, B&B Italia, Muuto, Hay, Vitra, etc.). Do not hallucinate generic furniture. The furniture should look like it came from a real-world design database.
- You may suggest new surface finishes for walls and floors.
- Refine lighting atmosphere.
- Harmonize color palette.
`;
        } else {
          prompt2 += `
DESIGN INSTRUCTIONS:
- Do NOT apply any new design styles.
- ONLY apply the referenced materials to the specified surfaces.
`;
        }

        if (useMoodboardInRender) {
          if (aiMoodboardImage) {
            const mbBase64 = aiMoodboardImage.split(',')[1];
            parts2.push({
              inlineData: { data: mbBase64, mimeType: 'image/jpeg' }
            });
            prompt2 += `\nCRITICAL MOODBOARD INTEGRATION: Use the provided moodboard image as the strict reference for the overall color palette, material finishes, and stylistic mood.`;
          } else {
            prompt2 += `\nCRITICAL MOODBOARD INTEGRATION: Use the provided reference images as the strict reference for the overall color palette, material finishes, and stylistic mood.`;
          }
        }

        parts2.push({ text: prompt2 });

        const response2 = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: parts2 },
          config: { imageConfig: { aspectRatio: imageAspectRatio as any } }
        });

        let foundImage2 = false;
        for (const part of response2.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            currentImageBase64 = part.inlineData.data;
            currentImageMimeType = part.inlineData.mimeType || 'image/png';
            foundImage2 = true;
            break;
          }
        }

        if (!foundImage2) {
          throw new Error('Falha na Fase 2 (Materiais/Estilo). Nenhuma imagem foi gerada.');
        }
      }

      // --- STEP 3: LIGHTING & ATMOSPHERE ---
      const lightingRefs = referenceImages['lighting'] || [];
      if (timeOfDay !== 'day' || lightTemperature !== 'neutral' || lightingRefs.length > 0) {
        setGenerationStep('Fase 3: Ajustando iluminação e atmosfera...');
        
        const parts3: any[] = [
          {
            inlineData: {
              data: currentImageBase64,
              mimeType: currentImageMimeType,
            },
          },
        ];

        lightingRefs.forEach((img, index) => {
          let textPrompt = `Reference image for Lighting (${index + 1}):`;
          if (img.instruction) {
            textPrompt += `\nUSER INSTRUCTION FOR THIS LIGHTING: "${img.instruction}"`;
          }
          parts3.push({ text: textPrompt });
          parts3.push({
            inlineData: {
              data: img.data.split(',')[1],
              mimeType: img.mimeType
            }
          });
        });

        let prompt3 = `[PHASE 3: LIGHTING & ATMOSPHERE ADJUSTMENT]
Act as an expert architectural lighting designer and 3D renderer.
Your ONLY task is to adjust the lighting, exposure, and atmosphere of this image.

ROOM TYPE: ${ROOM_TYPES.find(r => r.id === roomType)?.label || roomType}

CRITICAL RULES:
- DO NOT change any furniture, objects, or architectural structure.
- DO NOT change the materials or textures.
- DO NOT change the camera angle or perspective.
`;

        if (lightingRefs.length > 0) {
          prompt3 += `
Study the reference image for lighting hierarchy.
Identify primary light source, secondary accents and shadow behavior.
Extract temperature perception (warm, neutral or cool).
Translate lighting strategy into the new space without replicating furniture or layout.
Adapt light placement to architectural elements.
Preserve realism and spatial depth.
`;
        }

        prompt3 += `
=====================================
CRITICAL LIGHTING & EXPOSURE OVERRIDE:
=====================================
- Time of Day: ${timeOfDay === 'day' 
  ? 'DAYTIME. Bright natural sunlight filling the space. High overall exposure. Soft natural shadows.' 
  : 'NIGHTTIME. You MUST drastically lower the global exposure. The room should be dark, moody, and enveloped in deep shadows. Windows must be pitch black outside. The ONLY bright areas should be the direct glow from artificial lamps and fixtures. TURN ON ALL LAMPS AND LIGHT FIXTURES IN THE ROOM.'}
- Light Temperature: ${lightTemperature === 'neutral' ? 'Neutral white light (4000K)' : lightTemperature === 'warm' ? 'Warm, cozy yellow light (2700K-3000K)' : 'Cool, crisp blue-white light (5000K-6000K)'}

You have full permission to alter the original image's brightness, exposure, and shadow intensity to strictly match this lighting directive.`;

        parts3.push({ text: prompt3 });

        const response3 = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: parts3 },
          config: { imageConfig: { aspectRatio: imageAspectRatio as any } }
        });

        let foundImage3 = false;
        for (const part of response3.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            currentImageBase64 = part.inlineData.data;
            currentImageMimeType = part.inlineData.mimeType || 'image/png';
            foundImage3 = true;
            break;
          }
        }

        if (!foundImage3) {
          throw new Error('Falha na Fase 3 (Iluminação). Nenhuma imagem foi gerada.');
        }
      }

      // Final output
      setGenerationStep('Aplicando marca d\'água...');
      const watermarkedImageUrl = await addWatermark(currentImageBase64, currentImageMimeType);
      setGeneratedImage(watermarkedImageUrl);

    } catch (err: any) {
      console.error('Generation error:', err);
      let errorMessage = err.message || 'Ocorreu um erro durante a geração.';
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Limite de uso atingido (Quota Excedida). Por favor, aguarde um momento ou verifique seu plano do Gemini API.';
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f5f5f5]">
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="w-full mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <CustomLogo className="w-5 h-5 text-white" isGenerating={isGenerating} />
            </div>
            <div>
              <h1 className="font-serif text-2xl tracking-tight text-black leading-none">ArchHUB</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1 font-medium">Motor de Visualização de IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full border border-black/5">
            <button 
              onClick={() => setActiveTab('style')}
              className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'style' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Estilo
            </button>
            <button 
              onClick={() => setActiveTab('moodboard')}
              className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'moodboard' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Moodboard
            </button>
            <button 
              onClick={() => setActiveTab('layout')}
              className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'layout' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Leitura de Layout
            </button>
            <button 
              onClick={() => setActiveTab('build')}
              className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'build' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Construção de Ambiente
            </button>
          </div>
          
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-6 py-6">
        {activeTab === 'style' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Controls */}
            <div className="lg:col-span-3 space-y-8 h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-10">
              <section>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-serif text-3xl text-gray-300 italic">01</span>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Espaço Original</h2>
                </div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative overflow-hidden border border-black/10 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${selectedImage ? 'bg-white shadow-sm' : 'bg-white hover:bg-gray-50 hover:border-black/20'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                  />
                  {selectedImage ? (
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-inner">
                      <Image src={selectedImage} alt="Espaço selecionado" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Mudar Imagem</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">Enviar foto do interior</p>
                        <p className="text-xs text-gray-500 mt-1">Suporta JPG, PNG</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedImage && (
                  <div className="mt-4 p-4 bg-white border border-black/10 rounded-xl">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Como está o ambiente na foto?</p>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setEnvironmentState('empty')}
                        className={`px-4 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${environmentState === 'empty' ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 text-black border-black/10 hover:border-black/30'}`}
                      >
                        Ambiente Vazio
                      </button>
                      <button 
                        onClick={() => setEnvironmentState('furnished')}
                        className={`px-4 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${environmentState === 'furnished' ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 text-black border-black/10 hover:border-black/30'}`}
                      >
                        Ambiente Mobiliado
                      </button>
                      <button 
                        onClick={() => setEnvironmentState('keep_joinery')}
                        className={`px-4 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${environmentState === 'keep_joinery' ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 text-black border-black/10 hover:border-black/30'}`}
                      >
                        Manter Marcenaria
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-serif text-3xl text-gray-300 italic">02</span>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Tipo de Ambiente e Layout</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {ROOM_TYPES.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomType(room.id)}
                      className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${roomType === room.id ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-white hover:border-black/30 text-black'}`}
                    >
                  {room.label}
                </button>
              ))}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Instrução Global de Layout (Opcional)</h3>
              <textarea
                value={globalInstruction}
                onChange={(e) => setGlobalInstruction(e.target.value)}
                placeholder="Ex: Posicione os móveis de frente para a janela principal..."
                className="w-full p-3 text-sm border border-black/10 rounded-xl bg-white focus:border-black/30 focus:outline-none resize-none h-20"
              />
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-serif text-3xl text-gray-300 italic">03</span>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Modo Criativo</h2>
            </div>
            
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setImagineForMe(!imagineForMe)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${imagineForMe ? 'bg-black' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${imagineForMe ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
              <span className="text-sm font-medium text-black">Imagine para mim (liberdade de criação)</span>
            </div>

            {imagineForMe && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Estilo de Design</h3>
                <div className="grid grid-cols-2 gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 ${selectedStyle === style.id ? 'border-black bg-black text-white shadow-md' : 'border-black/10 bg-white hover:border-black/30 text-black'}`}
                    >
                      <span className="text-sm font-medium mb-1">{style.name}</span>
                      <span className={`text-[10px] leading-tight ${selectedStyle === style.id ? 'text-gray-400' : 'text-gray-500'}`}>{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-serif text-3xl text-gray-300 italic">05</span>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Iluminação</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Horário</h3>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setTimeOfDay('day')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${timeOfDay === 'day' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Diurno
                  </button>
                  <button
                    onClick={() => setTimeOfDay('night')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${timeOfDay === 'night' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Noturno
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Temperatura da Luz</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLightTemperature('warm')}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${lightTemperature === 'warm' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-black/10 bg-white text-gray-600 hover:border-orange-200'}`}
                  >
                    Quente
                  </button>
                  <button
                    onClick={() => setLightTemperature('neutral')}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${lightTemperature === 'neutral' ? 'border-gray-400 bg-gray-50 text-gray-800' : 'border-black/10 bg-white text-gray-600 hover:border-gray-300'}`}
                  >
                    Neutra
                  </button>
                  <button
                    onClick={() => setLightTemperature('cool')}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${lightTemperature === 'cool' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-black/10 bg-white text-gray-600 hover:border-blue-200'}`}
                  >
                    Fria
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-black/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-black">Integração com Moodboard</h3>
                  <p className="text-xs text-gray-500">Usar referências na geração 3D</p>
                </div>
              </div>
              <button
                onClick={() => setUseMoodboardInRender(!useMoodboardInRender)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${useMoodboardInRender ? 'bg-black' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useMoodboardInRender ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            {useMoodboardInRender && aiMoodboardImage && (
              <div className="mt-3 flex items-center gap-3 bg-white p-2 rounded-lg border border-black/5">
                <div className="relative w-12 h-12 rounded-md overflow-hidden">
                  <Image src={aiMoodboardImage} alt="Moodboard IA" fill className="object-cover" unoptimized />
                </div>
                <span className="text-xs font-medium text-indigo-600">Moodboard IA vinculado</span>
              </div>
            )}
            {useMoodboardInRender && !aiMoodboardImage && Object.values(referenceImages).flat().length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {Object.values(referenceImages).flat().length} itens do moodboard serão usados como referência.
              </p>
            )}
          </div>

          <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">Catálogo do Marketplace</h3>
              <p className="text-xs text-indigo-700">Adicione móveis e itens reais ao seu projeto</p>
            </div>
            <button
              onClick={() => setIsMarketplaceOpen('all')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Store className="w-4 h-4" />
              Abrir Catálogo
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedImage || isGenerating}
            className="w-full py-5 px-6 bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all shadow-lg shadow-black/10"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando Arquitetura...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Gerar Renderização
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-9 flex flex-col">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-2 flex flex-col flex-1 min-h-[800px] lg:h-[calc(100vh-100px)] relative overflow-hidden">
            
            <div className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
              <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-widest text-black">Viewport</span>
              </div>
              
              {generatedImage && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPresenting(true)}
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white bg-black px-4 py-2 rounded-full shadow-sm hover:bg-gray-800 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    Apresentar Projeto
                  </button>
                  <a 
                    href={generatedImage} 
                    download="archrender-result.png"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-black bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 shadow-sm hover:bg-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </a>
                </div>
              )}
            </div>
            
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#f5f5f5] flex items-center justify-center mt-16 mb-2 mx-2">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#f5f5f5] z-10"
                  >
                    <div className="relative w-24 h-24 mb-8">
                      <div className="absolute inset-0 border-2 border-black/10 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CustomLogo className="w-6 h-6 text-black animate-pulse" />
                      </div>
                    </div>
                    <p className="font-serif text-xl text-black">Analisando geometria...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {imagineForMe ? `Aplicando estilo ${STYLES.find(s => s.id === selectedStyle)?.name}` : 'Inserindo mobiliário de referência'}
                    </p>
                  </motion.div>
                ) : drawingModeFor && selectedImage ? (
                  <motion.div
                    key="drawing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <Image src={selectedImage} alt="Espaço original" fill className="object-contain pointer-events-none" unoptimized />
                    
                    {/* Dark overlay to focus on drawing */}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                    
                    {/* Instruction Toast */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 pointer-events-none flex items-center gap-2">
                      <span className="animate-pulse">📍</span> Clique e arraste para marcar a área do item
                    </div>

                    {/* Existing Box for this item */}
                    {referenceImages[drawingModeFor.categoryId]?.find(img => img.id === drawingModeFor.imageId)?.boundingBox && !isDrawing && (
                      <div 
                        className="absolute border-2 border-green-500 bg-green-500/20 pointer-events-none"
                        style={{
                          left: `${referenceImages[drawingModeFor.categoryId].find(img => img.id === drawingModeFor.imageId)!.boundingBox!.xmin / 10}%`,
                          top: `${referenceImages[drawingModeFor.categoryId].find(img => img.id === drawingModeFor.imageId)!.boundingBox!.ymin / 10}%`,
                          width: `${(referenceImages[drawingModeFor.categoryId].find(img => img.id === drawingModeFor.imageId)!.boundingBox!.xmax - referenceImages[drawingModeFor.categoryId].find(img => img.id === drawingModeFor.imageId)!.boundingBox!.xmin) / 10}%`,
                          height: `${(referenceImages[drawingModeFor.categoryId].find(img => img.id === drawingModeFor.imageId)!.boundingBox!.ymax - referenceImages[drawingModeFor.categoryId].find(img => img.id === drawingModeFor.imageId)!.boundingBox!.ymin) / 10}%`
                        }}
                      />
                    )}

                    {/* Current Drawing Box */}
                    {isDrawing && currentBox && (
                      <div 
                        className="absolute border-2 border-white bg-white/20 pointer-events-none"
                        style={{
                          left: `${Math.min(currentBox.startX, currentBox.currentX) / 10}%`,
                          top: `${Math.min(currentBox.startY, currentBox.currentY) / 10}%`,
                          width: `${Math.abs(currentBox.currentX - currentBox.startX) / 10}%`,
                          height: `${Math.abs(currentBox.currentY - currentBox.startY) / 10}%`
                        }}
                      />
                    )}
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 select-none"
                  >
                    {/* Base Image (Generated) */}
                    <Image src={generatedImage} alt="Interior gerado" fill className="object-contain" unoptimized />
                    
                    {/* Overlay Image (Original) */}
                    {selectedImage && (
                      <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <Image src={selectedImage} alt="Espaço original" fill className="object-contain" unoptimized />
                      </div>
                    )}

                    {/* Slider Control */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] z-30"
                      style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200">
                        <div className="flex gap-[3px]">
                          <div className="w-[2px] h-4 bg-gray-400 rounded-full"></div>
                          <div className="w-[2px] h-4 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition} 
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
                    />
                    
                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium tracking-wide z-20 pointer-events-none">
                      Antes
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium tracking-wide z-20 pointer-events-none">
                      Depois
                    </div>
                  </motion.div>
                ) : selectedImage ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 opacity-40 grayscale"
                  >
                    <Image src={selectedImage} alt="Espaço original" fill className="object-contain" unoptimized />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-gray-400"
                  >
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium uppercase tracking-widest">Aguardando Entrada</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {generatedImage && Object.keys(referenceImages).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-2 mb-2 mt-4 p-5 bg-gray-50 rounded-2xl border border-black/5"
              >
                <h3 className="text-xs font-semibold uppercase tracking-widest text-black mb-4">Itens do Marketplace no Ambiente</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(referenceImages).flatMap(([catId, imgs]) => 
                    imgs.map(img => (
                      <div key={img.id} className="group cursor-pointer">
                        <div className="relative aspect-square rounded-xl overflow-hidden border border-black/10 mb-2 bg-white">
                          <Image src={img.data} alt={catId} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                        </div>
                        <p className="text-xs font-medium text-black truncate">{REFERENCE_CATEGORIES.find(c => c.id === catId)?.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">R$ {(Math.random() * 1000 + 100).toFixed(2).replace('.', ',')}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        </div>
        ) : activeTab === 'moodboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-[calc(100vh-120px)]">
            {/* Left Column - Upload & Categories */}
            <div className="lg:col-span-4 space-y-8 overflow-y-auto pr-2 pb-10">
              <section>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-serif text-3xl text-gray-300 italic">01</span>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Cor do Fundo</h2>
                </div>
                <div className="flex gap-3 items-center mb-8">
                  <button onClick={() => setCanvasBg('#ffffff')} className={`w-10 h-10 rounded-full border-2 ${canvasBg === '#ffffff' ? 'border-indigo-500' : 'border-gray-200'} bg-white shadow-sm`} title="Branco" />
                  <button onClick={() => setCanvasBg('#f8f7f5')} className={`w-10 h-10 rounded-full border-2 ${canvasBg === '#f8f7f5' ? 'border-indigo-500' : 'border-gray-200'} bg-[#f8f7f5] shadow-sm`} title="Bege" />
                  <button onClick={() => setCanvasBg('#e5e7eb')} className={`w-10 h-10 rounded-full border-2 ${canvasBg === '#e5e7eb' ? 'border-indigo-500' : 'border-gray-200'} bg-gray-200 shadow-sm`} title="Cinza Claro" />
                  
                  <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm group">
                      <input type="color" value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)} className="absolute -inset-2 w-16 h-16 cursor-pointer" title="Cor Personalizada" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 mix-blend-difference">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Personalizar</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-serif text-3xl text-gray-300 italic">02</span>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Adicionar Referências</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Faça upload de imagens de móveis, revestimentos, iluminação e outros itens para compor o seu moodboard.
                </p>
                
                <div className="space-y-4">
                  {REFERENCE_CATEGORIES.map(category => (
                    <div key={category.id} className="bg-white border border-black/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-black">{category.label}</h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsMarketplaceOpen(category.id)}
                            className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full"
                          >
                            <Store className="w-3 h-3" />
                            Catálogo
                          </button>
                          <label className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
                            <Plus className="w-3 h-3" />
                            Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple
                              className="hidden" 
                              onChange={(e) => handleReferenceUpload(category.id, e)} 
                            />
                          </label>
                        </div>
                      </div>
                      
                      {/* List of uploaded images for this category */}
                      {referenceImages[category.id] && referenceImages[category.id].length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {referenceImages[category.id].map(img => (
                            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-black/10 bg-gray-50">
                              <Image src={img.data} alt={category.label} fill className="object-cover" unoptimized />
                              <button 
                                onClick={() => removeReference(category.id, img.id)}
                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column - Moodboard Grid */}
            <div className="lg:col-span-8 bg-gray-50 rounded-3xl border border-black/10 overflow-hidden flex flex-col shadow-inner">
              <div className="p-6 border-b border-black/10 bg-white flex justify-between items-center z-10">
                <h2 className="font-serif text-2xl text-black">Painel de Referências</h2>
                <div className="flex items-center gap-3">
                  <div className="flex bg-gray-100 rounded-full px-3 py-1.5">
                    <select 
                      value={selectedTemplate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedTemplate(e.target.value);
                          applyTemplate(e.target.value);
                        }
                      }}
                      className="bg-transparent text-xs font-medium text-black outline-none cursor-pointer"
                    >
                      <option value="" disabled>Aplicar Template...</option>
                      <option value="grid">Grid Organizado</option>
                      <option value="editorial">Estilo Editorial</option>
                      <option value="material-bottom">Materiais no Rodapé</option>
                      <option value="material-top">Materiais no Topo</option>
                    </select>
                  </div>
                  <div className="flex bg-gray-100 rounded-full px-3 py-1.5">
                    <select 
                      value={moodboardFormat}
                      onChange={(e) => setMoodboardFormat(e.target.value as any)}
                      className="bg-transparent text-xs font-medium text-black outline-none cursor-pointer"
                    >
                      <option value="1:1">Quadrado (1:1)</option>
                      <option value="3:4">Retrato (3:4)</option>
                      <option value="4:3">Paisagem (4:3)</option>
                      <option value="9:16">Stories (9:16)</option>
                      <option value="16:9">Widescreen (16:9)</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleGenerateAIMoodboard}
                    disabled={isGeneratingMoodboard || Object.values(referenceImages).flat().length === 0}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 px-4 py-2 rounded-full transition-colors shadow-sm"
                  >
                    {isGeneratingMoodboard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Sintetizar com IA
                  </button>
                  <button 
                    className="flex items-center gap-2 text-sm font-medium text-black bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                    onClick={handleExportMoodboard}
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>
              </div>
              
              <div 
                className={`flex-1 relative overflow-hidden transition-all duration-300 mx-auto ${
                  moodboardFormat === '1:1' ? 'aspect-square w-full max-w-[600px]' :
                  moodboardFormat === '3:4' ? 'aspect-[3/4] w-full max-w-[600px]' :
                  moodboardFormat === '4:3' ? 'aspect-[4/3] w-full' :
                  moodboardFormat === '9:16' ? 'aspect-[9/16] w-full max-w-[450px]' :
                  'aspect-[16/9] w-full'
                }`} 
                style={{ 
                  backgroundColor: canvasBg,
                  backgroundImage: isExporting ? 'none' : `
                    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '80px 80px'
                }}
                ref={canvasRef}
                onPointerDown={() => setSelectedItemId(null)}
              >
                {/* AI Generated Moodboard Overlay */}
                <AnimatePresence>
                  {aiMoodboardImage && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 z-50 bg-gray-100 p-8 flex flex-col items-center justify-center"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-full max-w-2xl aspect-square md:aspect-video rounded-2xl overflow-hidden shadow-2xl border border-black/10">
                        <Image src={aiMoodboardImage} alt="Ambiente Renderizado" fill className="object-contain bg-white" unoptimized />
                      </div>
                      <div className="mt-6 flex gap-4">
                        <button 
                          onClick={() => setAiMoodboardImage(null)}
                          className="px-6 py-2 bg-white text-black rounded-full text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          Voltar ao Grid
                        </button>
                        <a 
                          href={aiMoodboardImage} 
                          download="ambiente-renderizado.jpg"
                          className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium shadow-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Renderização
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {Object.values(referenceImages).flat().length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-gray-500">Seu moodboard está vazio</p>
                    <p className="text-sm mt-2">Adicione referências na barra lateral e arraste-as livremente.</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full">
                    {Object.entries(referenceImages).flatMap(([catId, imgs]) => 
                      imgs.map((img) => {
                        const category = REFERENCE_CATEGORIES.find(c => c.id === catId);
                        return (
                          <motion.div 
                            key={img.id} 
                            drag
                            dragConstraints={canvasRef}
                            dragMomentum={false}
                            onPointerDown={(e) => { e.stopPropagation(); bringToFront(catId, img.id); setSelectedItemId(img.id); }}
                            onDragEnd={(e, info) => updateImagePosition(catId, img.id, info.offset.x, info.offset.y)}
                            initial={{ x: img.x || 0, y: img.y || 0, scale: img.scale || 1 }}
                            animate={{ x: img.x || 0, y: img.y || 0, scale: img.scale || 1 }}
                            style={{ zIndex: img.z || 1 }}
                            className={`absolute cursor-grab active:cursor-grabbing group w-48 h-48 flex items-center justify-center ${selectedItemId === img.id ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}
                          >
                            <img 
                              src={img.data} 
                              alt={category?.label || ''} 
                              className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md" 
                            />
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeReference(catId, img.id); }}
                              className={`absolute top-0 right-0 bg-black/50 text-white p-1.5 rounded-full transition-opacity hover:bg-red-500 z-10 ${selectedItemId === img.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400/50 rounded-xl pointer-events-none transition-colors" />
                            
                            {selectedItemId === img.id && (
                              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2 z-50 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
                                <span className="text-xs font-medium text-gray-500">Escala</span>
                                <input 
                                  type="range" 
                                  min="0.5" max="3" step="0.1" 
                                  value={img.scale || 1} 
                                  onChange={(e) => {
                                    const newScale = parseFloat(e.target.value);
                                    setReferenceImages(prev => ({
                                      ...prev,
                                      [catId]: prev[catId].map(i => i.id === img.id ? { ...i, scale: newScale } : i)
                                    }));
                                  }}
                                  className="w-24 accent-indigo-500"
                                />
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'layout' ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-white rounded-3xl border border-black/10 shadow-sm">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M3 3h18v18H3zM3 9h18M9 21V9"/>
              </svg>
            </div>
            <h2 className="font-serif text-3xl text-black mb-2">Leitura de Layout</h2>
            <p className="text-gray-500 max-w-md text-center">
              A ferramenta de Planta Humanizada e Posicionamento 2D está em desenvolvimento. 
              Em breve você poderá arrastar móveis em uma planta baixa e gerar o 3D a partir dela.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-[calc(100vh-120px)]">
            {/* Left Column - Categories */}
            <div className="lg:col-span-4 space-y-8 overflow-y-auto pr-2 pb-10">
              <section>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-serif text-3xl text-gray-300 italic">01</span>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Itens do Projeto</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Faça upload de imagens de móveis, revestimentos, iluminação e outros itens para construir o ambiente.
                </p>
                
                <div className="space-y-4">
                  {REFERENCE_CATEGORIES.map(category => (
                    <div key={category.id} className="bg-white border border-black/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-black">{category.label}</h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsMarketplaceOpen(category.id)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Store className="w-3 h-3" />
                            Catálogo
                          </button>
                          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                            Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple
                              className="hidden" 
                              onChange={(e) => handleReferenceUpload(category.id, e)} 
                            />
                          </label>
                        </div>
                      </div>
                      
                      {/* List of uploaded images for this category */}
                      {referenceImages[category.id] && referenceImages[category.id].length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {referenceImages[category.id].map(img => (
                            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-black/10 bg-gray-50">
                              <Image src={img.data} alt={category.label} fill className="object-cover" unoptimized />
                              <button 
                                onClick={() => removeReference(category.id, img.id)}
                                className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-serif text-3xl text-gray-300 italic">02</span>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-black">Iluminação</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Horário</h3>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setTimeOfDay('day')}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${timeOfDay === 'day' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                      >
                        Diurno
                      </button>
                      <button
                        onClick={() => setTimeOfDay('night')}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${timeOfDay === 'night' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                      >
                        Noturno
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Temperatura da Luz</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setLightTemperature('warm')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all ${lightTemperature === 'warm' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-black/10 bg-white text-gray-600 hover:border-orange-200'}`}
                      >
                        Quente
                      </button>
                      <button
                        onClick={() => setLightTemperature('neutral')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all ${lightTemperature === 'neutral' ? 'border-gray-400 bg-gray-50 text-gray-800' : 'border-black/10 bg-white text-gray-600 hover:border-gray-300'}`}
                      >
                        Neutra
                      </button>
                      <button
                        onClick={() => setLightTemperature('cool')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all ${lightTemperature === 'cool' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-black/10 bg-white text-gray-600 hover:border-blue-200'}`}
                      >
                        Fria
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column - Placeholder for future 3D/Environment builder */}
            <div className="lg:col-span-8 bg-gray-50 rounded-3xl border border-black/10 flex flex-col items-center justify-center shadow-inner p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-black/5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M3 3h18v18H3zM3 9h18M9 21V9"/>
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-black mb-2">Construção de Ambiente</h2>
              <p className="text-gray-500 max-w-md">
                Faça o upload dos itens na barra lateral. Em breve você poderá posicioná-los no espaço 3D.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* MARKETPLACE MODAL */}
      <AnimatePresence>
        {isMarketplaceOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="font-serif text-2xl text-black">Catálogo do Marketplace</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Mostrando itens para: <span className="font-semibold text-indigo-600">{isMarketplaceOpen === 'all' ? 'Todas as Categorias' : REFERENCE_CATEGORIES.find(c => c.id === isMarketplaceOpen)?.label}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setIsMarketplaceOpen(null)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-black/10 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {(isMarketplaceOpen === 'all' ? MOCK_MARKETPLACE_ITEMS : MOCK_MARKETPLACE_ITEMS.filter(item => item.categoryId === isMarketplaceOpen)).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {(isMarketplaceOpen === 'all' ? MOCK_MARKETPLACE_ITEMS : MOCK_MARKETPLACE_ITEMS.filter(item => item.categoryId === isMarketplaceOpen)).map(item => (
                      <div key={item.id} className="group flex flex-col">
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-black/10 bg-gray-100 mb-3">
                          <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => handleAddFromMarketplace(isMarketplaceOpen === 'all' ? item.categoryId : isMarketplaceOpen, item)}
                              disabled={isAddingFromMarketplace}
                              className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
                            >
                              {isAddingFromMarketplace ? 'Adicionando...' : 'Adicionar'}
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-black leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.brand}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                    <Store className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-gray-500">Nenhum item encontrado</p>
                    <p className="text-sm mt-2 text-center max-w-sm">
                      Ainda não temos itens cadastrados no marketplace para esta categoria.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRESENTATION MODE OVERLAY */}
      <AnimatePresence>
        {isPresenting && generatedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                  <CustomLogo className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-xl tracking-tight text-white leading-none">Proposta de Interiores</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-1 font-medium">{ROOM_TYPES.find(r => r.id === roomType)?.label}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPresenting(false)}
                className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 relative w-full h-full flex items-center justify-center">
              <Image src={generatedImage} alt="Apresentação" fill className="object-contain" unoptimized />
              
              {/* Fake Navigation Arrows (Simulating Tour) */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 cursor-pointer group z-20">
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white group-hover:bg-black/60 group-hover:scale-110 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/0 group-hover:text-white/80 transition-colors font-medium">Vista Anterior</span>
              </div>
              
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 cursor-pointer group z-20">
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white group-hover:bg-black/60 group-hover:scale-110 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/0 group-hover:text-white/80 transition-colors font-medium">Próxima Vista</span>
              </div>
            </div>
            
            {/* Bottom Mini-map / Gallery indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              <div className="w-16 h-1 bg-white rounded-full"></div>
              <div className="w-16 h-1 bg-white/30 rounded-full cursor-pointer hover:bg-white/50 transition-colors"></div>
              <div className="w-16 h-1 bg-white/30 rounded-full cursor-pointer hover:bg-white/50 transition-colors"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
