import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";

export type HelloResult = {
  message: string;
};

function getGrpcAddress(): string {
  const addr = process.env.ADMIN_GRPC_ADDR || process.env.GRPC_ADDR;
  if (!addr) return "127.0.0.1:50051";

  // Go server defaults to ":50051"; Node gRPC needs a host.
  if (addr.startsWith(":")) return `127.0.0.1${addr}`;
  return addr;
}

function getSampleProtoPath(): string {
  return path.resolve(process.cwd(), "../../api/admin/v1/sample.proto");
}

type SampleServiceClient = grpc.Client & {
  Hello?: (
    req: { name?: string },
    cb: (err: grpc.ServiceError | null, res?: { message?: string }) => void,
  ) => void;
  hello?: (
    req: { name?: string },
    cb: (err: grpc.ServiceError | null, res?: { message?: string }) => void,
  ) => void;
};

function createSampleServiceClient(): SampleServiceClient {
  const protoPath = getSampleProtoPath();

  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as unknown as {
    api?: { admin?: { v1?: { SampleService?: grpc.ServiceClientConstructor } } };
  };

  const serviceCtor = grpcObject.api?.admin?.v1?.SampleService;
  if (!serviceCtor) {
    throw new Error(
      "Failed to load api.admin.v1.SampleService from sample.proto (path: " +
        protoPath +
        ")",
    );
  }

  return new serviceCtor(getGrpcAddress(), grpc.credentials.createInsecure()) as SampleServiceClient;
}

export async function callHello(name?: string): Promise<HelloResult> {
  const client = createSampleServiceClient();

  try {
    const response = await new Promise<{ message?: string }>((resolve, reject) => {
      const method = client.Hello ?? client.hello;
      if (!method) {
        reject(new Error("SampleService client is missing Hello method"));
        return;
      }

      method.call(client, { name }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res ?? {});
      });
    });

    return { message: response.message ?? "" };
  } finally {
    client.close();
  }
}
