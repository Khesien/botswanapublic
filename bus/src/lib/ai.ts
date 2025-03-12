import * as tf from '@tensorflow/tfjs';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

export class AIAssistant {
  private static instance: AIAssistant;
  private model: tf.LayersModel | null = null;
  private intentPatterns: Map<string, string[]> = new Map();

  private constructor() {
    this.initializeIntentPatterns();
    this.trainClassifier();
  }

  static getInstance(): AIAssistant {
    if (!AIAssistant.instance) {
      AIAssistant.instance = new AIAssistant();
    }
    return AIAssistant.instance;
  }

  private initializeIntentPatterns() {
    this.intentPatterns.set('booking', [
      'book a bus',
      'reserve a seat',
      'make a reservation',
      'schedule a trip'
    ]);
    
    this.intentPatterns.set('tracking', [
      'track my bus',
      'where is my bus',
      'bus location',
      'arrival time'
    ]);

    this.intentPatterns.set('support', [
      'help',
      'support',
      'assistance',
      'contact'
    ]);
  }

  private trainClassifier() {
    this.intentPatterns.forEach((patterns, intent) => {
      patterns.forEach(pattern => {
        classifier.addDocument(pattern, intent);
      });
    });
    classifier.train();
  }

  async loadModel() {
    try {
      this.model = await tf.loadLayersModel('/models/sentiment_analysis.json');
    } catch (error) {
      console.error('Error loading AI model:', error);
    }
  }

  async analyzeSentiment(text: string): Promise<number> {
    if (!this.model) {
      await this.loadModel();
    }

    const tokens = tokenizer.tokenize(text.toLowerCase());
    // Convert tokens to tensor and predict sentiment
    const prediction = await this.model!.predict(tf.tensor([tokens])) as tf.Tensor;
    return prediction.dataSync()[0];
  }

  classifyIntent(text: string): string {
    return classifier.classify(text);
  }

  generateResponse(intent: string, context: any): string {
    const responses = {
      booking: `I can help you book a bus from ${context.from} to ${context.to}. The journey will take approximately ${context.duration} hours and cost ${context.price} BWP.`,
      tracking: `Your bus is currently at ${context.location}. Estimated arrival time at ${context.destination} is ${context.eta}.`,
      support: `I'm here to help! You can reach our support team at ${context.supportEmail} or call ${context.supportPhone}.`
    };

    return responses[intent as keyof typeof responses] || "I'm not sure how to help with that.";
  }

  async predictBusDelay(weatherData: any, trafficData: any, historicalData: any): Promise<number> {
    const features = tf.tensor2d([
      [
        weatherData.rainfall,
        weatherData.visibility,
        trafficData.congestion,
        historicalData.averageDelay
      ]
    ]);

    const prediction = await this.model!.predict(features) as tf.Tensor;
    return prediction.dataSync()[0];
  }

  recommendSeats(preferences: any, occupiedSeats: number[]): number[] {
    const availableSeats = Array.from(
      { length: preferences.totalSeats },
      (_, i) => i + 1
    ).filter(seat => !occupiedSeats.includes(seat));

    return availableSeats
      .filter(seat => {
        // Apply preference filters (window, aisle, etc.)
        if (preferences.windowSeat && !this.isWindowSeat(seat)) return false;
        if (preferences.aisleSeat && !this.isAisleSeat(seat)) return false;
        return true;
      })
      .slice(0, preferences.count);
  }

  private isWindowSeat(seat: number): boolean {
    // Implement window seat logic based on bus layout
    return seat % 4 === 0 || seat % 4 === 3;
  }

  private isAisleSeat(seat: number): boolean {
    // Implement aisle seat logic based on bus layout
    return seat % 4 === 1 || seat % 4 === 2;
  }

  async optimizeRoute(stops: any[], constraints: any): Promise<any[]> {
    // Implement route optimization using genetic algorithm
    const population = this.initializePopulation(stops);
    let bestRoute = population[0];
    let bestFitness = this.calculateFitness(bestRoute, constraints);

    for (let generation = 0; generation < 100; generation++) {
      const offspring = this.crossover(population);
      this.mutate(offspring);
      
      const fitness = this.calculateFitness(offspring[0], constraints);
      if (fitness > bestFitness) {
        bestRoute = offspring[0];
        bestFitness = fitness;
      }
    }

    return bestRoute;
  }

  private initializePopulation(stops: any[]): any[][] {
    // Initialize random population of routes
    return Array.from({ length: 50 }, () => this.shuffleArray([...stops]));
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private calculateFitness(route: any[], constraints: any): number {
    let fitness = 0;
    // Calculate route fitness based on distance, time, and constraints
    for (let i = 0; i < route.length - 1; i++) {
      const distance = this.calculateDistance(route[i], route[i + 1]);
      fitness += 1 / distance;
    }
    return fitness;
  }

  private calculateDistance(point1: any, point2: any): number {
    // Calculate distance between two points using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private crossover(population: any[][]): any[][] {
    // Implement ordered crossover for route optimization
    const offspring = [];
    for (let i = 0; i < population.length; i += 2) {
      const parent1 = population[i];
      const parent2 = population[i + 1] || population[0];
      offspring.push(this.orderCrossover(parent1, parent2));
    }
    return offspring;
  }

  private orderCrossover(parent1: any[], parent2: any[]): any[] {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;
    
    const child = Array(size).fill(null);
    child.splice(start, end - start, ...parent1.slice(start, end));
    
    let j = 0;
    for (let i = 0; i < size; i++) {
      if (child[i] === null) {
        while (child.includes(parent2[j])) j++;
        child[i] = parent2[j++];
      }
    }
    
    return child;
  }

  private mutate(routes: any[][]): void {
    // Implement swap mutation for route optimization
    const mutationRate = 0.1;
    routes.forEach(route => {
      if (Math.random() < mutationRate) {
        const i = Math.floor(Math.random() * route.length);
        const j = Math.floor(Math.random() * route.length);
        [route[i], route[j]] = [route[j], route[i]];
      }
    });
  }
}

export const ai = AIAssistant.getInstance();