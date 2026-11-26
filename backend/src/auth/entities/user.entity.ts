import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Session } from './session.entity';

export type AuthProvider = 'google' | 'microsoft' | 'facebook';

@Entity('users')
@Index(['provider', 'providerId'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 320 })
  email!: string;

  @Column({ length: 200, nullable: true })
  name!: string | null;

  @Column({ length: 32 })
  provider!: AuthProvider;

  @Column({ length: 191 })
  providerId!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
