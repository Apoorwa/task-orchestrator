import { Body, Controller, Post } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";

@Controller("invoice")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post("start")
  async start(@Body() body: { customerId: string }) {
    return this.invoiceService.startInvoiceWorkflow(body.customerId);
  }
}
