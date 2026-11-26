import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { MessagingService } from '../messaging/messaging.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const repository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const messaging = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repository },
        { provide: MessagingService, useValue: messaging },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('returns products ordered by name', async () => {
    const products = [{ id: '1', name: 'Lamp' }] as Product[];
    repository.find.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual(products);
    expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('seeds when empty', async () => {
    repository.count.mockResolvedValue(0);
    const created = [{ name: 'A' }];
    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    await service.onModuleInit();

    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(created);
    expect(messaging.publish).toHaveBeenCalledWith(
      'products.seeded',
      expect.objectContaining({ count: created.length }),
    );
  });

  it('skips seed when products exist', async () => {
    repository.count.mockResolvedValue(3);

    await service.onModuleInit();

    expect(repository.create).not.toHaveBeenCalled();
    expect(messaging.publish).not.toHaveBeenCalled();
  });
});
