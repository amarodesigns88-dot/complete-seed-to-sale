import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnterResultDto, GenerateCOADto, TestResultFilterDto } from './dto/lab.dto';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async enterResult(locationId: string, dto: EnterResultDto, userId: string) {
    // Verify sample exists
    const sample = await this.prisma.sample.findFirst({
      where: {
        id: dto.sampleId,
      },
      include: {
        inventoryItem: true,
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    if (sample.inventoryItem.locationId !== locationId) {
      throw new BadRequestException('Sample does not belong to this location');
    }

    if (sample.status !== 'ASSIGNED') {
      throw new BadRequestException('Sample must be assigned to a lab before entering results');
    }

    // Create test result
    const testResult = await this.prisma.testResult.create({
      data: {
        sampleId: dto.sampleId,
        testName: dto.testType || 'General Test',
        result: dto.result,
        pass: dto.pass !== undefined ? dto.pass : true,
      },
    });

    // Update sample status if result is entered
    await this.prisma.sample.update({
      where: { id: dto.sampleId },
      data: {
        status: dto.result === 'PASS' ? 'COMPLETED' : 'FAILED',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Lab",
        userId,
        actionType: 'TEST_RESULT_ENTERED',
        entityType: 'TestResult',
        entityId: testResult.id,
        newValue: JSON.stringify(testResult),
      },
    });

    return testResult;
  }

  async generateCOA(locationId: string, dto: GenerateCOADto, userId: string) {
    // Verify sample exists
    const sample = await this.prisma.sample.findFirst({
      where: {
        id: dto.sampleId,
      },
      include: {
        inventoryItem: true,
        testResults: true,
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    if (sample.inventoryItem.locationId !== locationId) {
      throw new BadRequestException('Sample does not belong to this location');
    }

    if (sample.status !== 'COMPLETED') {
      throw new BadRequestException('Sample must have all tests completed before generating COA');
    }

    // Check if all test results are PASS
    const hasFailedTests = sample.testResults.some(tr => tr.result === 'FAIL');
    if (hasFailedTests) {
      throw new BadRequestException('Cannot generate COA for sample with failed tests');
    }

    // Generate COA (in real implementation, this would create a PDF document)
    const coa = {
      sampleId: sample.id,
      certificationNumber: dto.certificationNumber,
      labName: sample.labName,
      sampleType: sample.sampleType,
      testResults: sample.testResults,
      generatedAt: new Date(),
      notes: dto.notes,
    };

    // Update sample with COA info
    const updatedSample = await this.prisma.sample.update({
      where: { id: dto.sampleId },
      data: {
        // coaGenerated field does not exist
        coaGeneratedAt: new Date(),
        coaCertificationNumber: dto.certificationNumber,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Lab",
        userId,
        actionType: 'COA_GENERATED',
        entityType: 'Sample',
        entityId: sample.id,
        newValue: JSON.stringify(coa),
      },
    });

    return coa;
  }

  async getTestResult(locationId: string, testResultId: string) {
    const testResult = await this.prisma.testResult.findFirst({
      where: {
        id: testResultId,
      },
      include: {
        sample: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!testResult) {
      throw new NotFoundException('Test result not found');
    }

    if (testResult.sample?.inventoryItem?.locationId !== locationId) {
      throw new BadRequestException('Test result does not belong to this location');
    }

    return testResult;
  }

  async listTestResults(locationId: string, filters: TestResultFilterDto) {
    const { testType, result, page = 1, limit = 30 } = filters;

    const where: any = {
      sample: {
        inventoryItem: {
          locationId,
        },
      },
    };

    if (testType) {
      where.testType = testType;
    }

    if (result) {
      where.result = result;
    }

    const [testResults, total] = await Promise.all([
      this.prisma.testResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sample: {
            select: {
              id: true,
              sampleType: true,
              inventoryItem: {
                select: {
                  barcode: true,
                  // strain field removed
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.testResult.count({ where }),
    ]);

    return {
      data: testResults,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSampleCOA(locationId: string, sampleId: string) {
    const sample = await this.prisma.sample.findFirst({
      where: {
        id: sampleId,
      },
      include: {
        inventoryItem: true,
        testResults: true,
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample or COA not found');
    }

    if (sample.inventoryItem?.locationId !== locationId) {
      throw new BadRequestException('Sample does not belong to this location');
    }

    return {
      sampleId: sample.id,
      certificationNumber: 'N/A', // coaCertificationNumber field doesn't exist
      labName: sample.labName || 'N/A',
      sampleType: sample.sampleType || 'N/A',
      testResults: sample.testResults || [],
      generatedAt: sample.createdAt, // coaGeneratedAt doesn't exist, using createdAt
    };
  }
}
