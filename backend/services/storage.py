"""
Storage Service - File storage abstraction layer
"""
import os
from pathlib import Path
from typing import Optional

import aiofiles
import boto3
from botocore.exceptions import ClientError

from config import settings


class StorageService:
    """Abstraction layer for file storage (local or S3)."""
    
    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        
        if self.backend == "s3":
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            self.bucket = settings.AWS_S3_BUCKET
        else:
            self.local_path = Path(settings.LOCAL_STORAGE_PATH)
            self.local_path.mkdir(parents=True, exist_ok=True)
    
    async def save_file(
        self,
        content: bytes,
        filename: str,
        folder: str = ""
    ) -> str:
        """
        Save file to storage.
        
        Returns the file path/key for retrieval.
        """
        if self.backend == "s3":
            return await self._save_to_s3(content, filename, folder)
        else:
            return await self._save_to_local(content, filename, folder)
    
    async def read_file(self, file_path: str) -> bytes:
        """Read file from storage."""
        if self.backend == "s3":
            return await self._read_from_s3(file_path)
        else:
            return await self._read_from_local(file_path)
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from storage."""
        if self.backend == "s3":
            return await self._delete_from_s3(file_path)
        else:
            return await self._delete_from_local(file_path)
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists."""
        if self.backend == "s3":
            return await self._exists_in_s3(file_path)
        else:
            return await self._exists_in_local(file_path)
    
    # Local storage methods
    async def _save_to_local(
        self,
        content: bytes,
        filename: str,
        folder: str
    ) -> str:
        """Save file to local filesystem."""
        folder_path = self.local_path / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        file_path = folder_path / filename
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        
        return str(file_path.relative_to(self.local_path))
    
    async def _read_from_local(self, file_path: str) -> bytes:
        """Read file from local filesystem."""
        full_path = self.local_path / file_path
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()
    
    async def _delete_from_local(self, file_path: str) -> bool:
        """Delete file from local filesystem."""
        full_path = self.local_path / file_path
        try:
            os.remove(full_path)
            return True
        except OSError:
            return False
    
    async def _exists_in_local(self, file_path: str) -> bool:
        """Check if file exists in local filesystem."""
        full_path = self.local_path / file_path
        return full_path.exists()
    
    # S3 storage methods
    async def _save_to_s3(
        self,
        content: bytes,
        filename: str,
        folder: str
    ) -> str:
        """Save file to S3."""
        key = f"{folder}/{filename}" if folder else filename
        
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content,
        )
        
        return key
    
    async def _read_from_s3(self, file_path: str) -> bytes:
        """Read file from S3."""
        response = self.s3_client.get_object(
            Bucket=self.bucket,
            Key=file_path,
        )
        return response["Body"].read()
    
    async def _delete_from_s3(self, file_path: str) -> bool:
        """Delete file from S3."""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket,
                Key=file_path,
            )
            return True
        except ClientError:
            return False
    
    async def _exists_in_s3(self, file_path: str) -> bool:
        """Check if file exists in S3."""
        try:
            self.s3_client.head_object(
                Bucket=self.bucket,
                Key=file_path,
            )
            return True
        except ClientError:
            return False
