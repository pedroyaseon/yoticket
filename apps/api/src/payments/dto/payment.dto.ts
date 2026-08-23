import { IsIn } from 'class-validator';
export class PaymentDto {
  @IsIn(['APPROVED', 'DECLINED']) outcome!: 'APPROVED' | 'DECLINED';
}
