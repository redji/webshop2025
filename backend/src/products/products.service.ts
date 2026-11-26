import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { MessagingService } from '../messaging/messaging.service';

const SEED_PRODUCTS: Array<Pick<Product, 'name' | 'description' | 'price' | 'inStock'>> = [
  {
    name: 'Ceramic Pour-Over Set',
    description: 'Hand-thrown carafe and dripper for slow morning coffee.',
    price: '48.00',
    inStock: true,
  },
  {
    name: 'Linen Market Tote',
    description: 'Heavyweight natural linen tote with reinforced straps.',
    price: '32.50',
    inStock: true,
  },
  {
    name: 'Oak Desk Lamp',
    description: 'Warm LED desk lamp with solid oak base and linen shade.',
    price: '89.00',
    inStock: true,
  },
  {
    name: 'Wool Throw Blanket',
    description: 'Soft merino throw in charcoal herringbone weave.',
    price: '76.00',
    inStock: false,
  },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly messaging: MessagingService,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({ order: { name: 'ASC' } });
  }

  findOne(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({ where: { id } });
  }

  private async seedIfEmpty() {
    const count = await this.productsRepository.count();
    if (count > 0) {
      return;
    }

    const created = this.productsRepository.create(SEED_PRODUCTS);
    await this.productsRepository.save(created);
    this.logger.log(`Seeded ${created.length} products`);
    await this.messaging.publish('products.seeded', {
      count: created.length,
      at: new Date().toISOString(),
    });
  }
}
