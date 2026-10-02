# Linux Config

## 1. Update OS

### 1.1. Nâng Version OS

{% stepper %}
{% step %}
#### Kiểm tra phiên bản OS hiện tại

```bash
lsb_release -a
uname -r
```
{% endstep %}

{% step %}
#### Update toàn bộ hệ thống

```bash
sudo apt update
sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y
sudo apt autoclean
```
{% endstep %}

{% step %}
#### Reboot

```bash
sudo reboot
```
{% endstep %}

{% step %}
#### Kiểm tra package lỗi sau khi reboot

```bash
sudo dpkg --configure -a
sudo apt --fix-broken install
```
{% endstep %}

{% step %}
#### Kiểm tra package held

```bash
apt-mark showhold
```

Nếu có package giữ version:

```bash
sudo apt-mark unhold <package-name>
```
{% endstep %}

{% step %}
#### Cài release upgrader

```bash
sudo apt install update-manager-core -y
```
{% endstep %}

{% step %}
#### Kiểm tra file cấu hình

```bash
sudo nano /etc/update-manager/release-upgrades
```

Đặt như sau:

```ini
Prompt=lts
```
{% endstep %}

{% step %}
#### Nâng cấp version OS

```bash
sudo do-release-upgrade
```

Trong quá trình upgrade sẽ hỏi giữ hay cập nhật version các file hệ thống thì chọn theo nhu cầu. Nếu hỏi giữ hay thay config file SSH thì chọn `keep the local version currently installed`.
{% endstep %}

{% step %}
#### Reboot và kiểm tra lại version

```bash
lsb_release -a
```
{% endstep %}

{% step %}
#### Kiểm tra lại repo đã thêm

Repo có thể bị xóa khi update.

```bash
ls /etc/apt/sources.list.d/
```
{% endstep %}

{% step %}
#### Cleanup sau nâng cấp

```bash
sudo apt autoremove --purge -y
sudo apt autoclean
```
{% endstep %}
{% endstepper %}

### 1.2. Update hệ thống

```bash
apt update
apt full-upgrade -y
apt autoremove -y
apt autoclean
```

Reboot để cập nhật kernel mới.

## 2. Network

### 2.1. Cấu hình Netplan

### 2.2. Cấu hình qua nmcli

Tạo profile cho card mạng mới:

```bash
sudo nmcli connection add type ethernet con-name ens19 ifname ens19 ipv4.method manual ipv4.addresses 192.168.1.10/24 ipv4.gateway 192.168.1.1 ipv4.dns "8.8.8.8 8.8.4.4"
```

## 3. Remote & Monitoring

### 3.1. SSH

Giới hạn SSH bằng account root:

```
Match Address {IP}
 PermitRootLogin yes
```

### 3.2. SFTP

{% stepper %}
{% step %}
#### Cấu hình cho SFTP chạy port riêng

```bash
sudo tee /etc/ssh/sshd_config_sftp > /dev/null <<'EOF'
Port 2222
ListenAddress 0.0.0.0
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
Subsystem sftp internal-sftp

Match User <USER>
 ChrootDirectory <PATH>
 ForceCommand internal-sftp
 X11Forwarding no
 AllowTcpForwarding no
 PermitTTY no
EOF
```
{% endstep %}

{% step %}
#### Tạo service riêng cho SFTP

```bash
sudo tee /etc/systemd/system/ssh-sftp.service > /dev/null <<'EOF'
[Unit]
Description=SSH SFTP Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/sbin/sshd -D -f /etc/ssh/sshd_config_sftp
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```
{% endstep %}

{% step %}
#### Comment cấu hình SFTP mặc định

Comment dòng sau trong `/etc/ssh/sshd_config` nếu muốn SSH không có SFTP:

```
Subsystem sftp /usr/lib/openssh/sftp-server
```
{% endstep %}

{% step %}
#### Khởi chạy dịch vụ

```bash
systemctl enable ssh-sftp
systemctl start ssh-sftp
systemctl status ssh-sftp
```
{% endstep %}
{% endstepper %}

## 4. User

### 4.1. Add User

#### Thêm user mới

```bash
USER="{USERNAME}"

sudo useradd -m -s /bin/bash -c "{NAME}" "$USER" && \
echo "$USER:PASS" | sudo chpasswd
```

#### User cho SFTP

```bash
USER="{USERNAME}"

sudo useradd -s /sbin/nologin "$USER" && echo "$USER:{PASSWORD}" | sudo chpasswd
```

### 4.2. Group

#### Thêm vào group

```bash
usermod -aG {GROUPS} {USERNAME}
```

#### Gỡ khỏi group

```bash
sudo gpasswd -d {USERNAME} {GROUPS}
```

### 4.3. Unlock account

#### Check trạng thái lock

```bash
passwd -S {USERNAME}
```

#### Kiểm tra faillock

```bash
faillock --user devops
```

#### Unlock account

```bash
passwd -u devops
```

#### Reset trạng thái faillock

```bash
faillock --user {USERNAME} --reset
```

## 5. File

### 5.1. ACL cho SFTP

Trong `/etc/ssh/sshd_config` cần có đoạn config sau:

```
Match User {USERNAME}
 ForceCommand internal-sftp
 PasswordAuthentication yes
 ChrootDirectory {PATH}
 PermitTunnel no
 AllowAgentForwarding no
 AllowTcpForwarding no
 X11Forwarding no
```

Folder được chroot phải thuộc root:

```bash
chown root:root {PATH}
chmod 755 {PATH}
```

Thêm quyền bằng ACL cho user:

```bash
setfacl -m u:{USERNAME}:rwx {PATH}
```

Tạo rule default cho folder:

```bash
setfacl -d -m u:{USERNAME}:rwx {PATH}
```

Xem ACL của folder:

```bash
getfacl {PATH}
```

### 5.2. SCP

Lệnh truyền file qua SCP:

```bash
scp {PATH_SRC} {USER}@{IP_Server_DST}:{PATH_DST}
```

Thêm option `-r` để truyền folder.

Tải file từ server về:

```bash
scp -r {USER}@{IP_Server_DST}:{PATH_SRC} {PATH_DST}
```

### 5.3. Đồng bộ file

#### Kiểm tra nội dung folder

```bash
rsync -avnc folder1 folder2
```

#### Đồng bộ giữ nguyên UID/GID

```bash
rsync -aAXHv --numeric-ids --info=progress2 /svr/nfs/ /nfsn/
```

* `-A`: Giữ ACL.
* `-X`: Giữ Extended Attributes.
* `-H`: Giữ Hard Link.
* `--numeric-ids`: Giữ nguyên UID/GID số, rất hữu ích khi sao chép dữ liệu NFS.
* `--info=progress2`: Hiển thị tiến trình tổng thể thay vì từng file.

#### Đồng bộ

```bash
rsync -avh --progress /svr/nfs/ /nfsn/
```

* `-a`: Archive mode, giữ nguyên quyền, owner, group, timestamp, symlink...
* `-v`: Hiển thị chi tiết.
* `-h`: Hiển thị dung lượng dễ đọc.
* `--progress`: Hiển thị tiến trình từng file.

## 6. Disk&#x20;

### 6.1. Scan lại disk

```bash
echo 1 > /sys/class/block/sda/device/rescan
```

#### 6.2. Scan disk mới

```bash
cat > /usr/local/bin/rescan_disk.sh << 'EOF'
#!/bin/bash

for host in /sys/class/scsi_host/host*; do
 echo "Scanning $host"
 echo "- - -" > "$host/scan"
done
EOF

chmod +x /usr/local/bin/rescan_disk.sh
/usr/local/bin/rescan_disk.sh
```

### 6.3. Xóa bớt dung lượng

```bash
journalctl --vacuum-size=50M
rm -rf /var/log/*.gz /var/log/*.[0-9]
rm -rf /var/cache/dnf/*
```

### 6.4. Lấy ID và tạo mount

```bash
echo "UUID=$(blkid -s UUID -o value /dev/sdb1) /data xfs defaults 0 0" >> /etc/fstab
```

### 6.5. Create LVM

{% stepper %}
{% step %}
#### Tạo Physical Volume

```bash
pvcreate /dev/sdb
```
{% endstep %}

{% step %}
#### Tạo Volume Group

```bash
vgcreate <vg_name> /dev/sdb
```
{% endstep %}

{% step %}
#### Tạo Logical Volume

```bash
lvcreate -l +100%FREE -n <lv_name> <vg_name>
```
{% endstep %}

{% step %}
#### Format phân vùng

```bash
mkfs.ext4 /dev/vg-data/lv-data
mkfs.xfs /dev/vg-data/lv-data
```
{% endstep %}

{% step %}
#### Lấy UUID và tạo fstab

Chạy lệnh `blkid` để lấy UUID của phân vùng.

```bash
nano /etc/fstab
```

```
UUID=<uuid> /data xfs defaults 0 0
```
{% endstep %}

{% step %}
#### Cập nhật và mount

```bash
systemctl daemon-reload
mount -a
```
{% endstep %}
{% endstepper %}

### 6.6. Extend LVM

#### Trên cùng 1 ổ cứng

```bash
parted /dev/sda
resizepart 3 100%

pvresize /dev/sda3

lvextend -l +100%FREE /dev/mapper/ubuntu-root

resize2fs /dev/mapper/ubuntu-root
xfs_growfs /
```

#### Trên ổ cứng mới

```bash
pvcreate /dev/sdb1

vgextend vg_data /dev/sdb1

lvextend -l +100%FREE /dev/vg_data/lv_data

resize2fs /dev/vg_data/lv_data
xfs_growfs /
```

### 6.7. Xóa LVM

{% stepper %}
{% step %}
#### Umount phân vùng

```bash
umount /data
```

Nếu đang bị sử dụng:

```bash
fuser -vm /data
```
{% endstep %}

{% step %}
#### Xóa khỏi fstab
{% endstep %}

{% step %}
#### Xóa Logical Volume

```bash
lvremove /dev/data_vg/lv_data
```

Xóa tất cả LV trong VG:

```bash
lvremove /dev/data_vg/*
```
{% endstep %}

{% step %}
#### Xóa Volume Group

```bash
vgremove data_vg
```
{% endstep %}

{% step %}
#### Xóa Physical Volume

```bash
pvremove /dev/sdb1
```
{% endstep %}
{% endstepper %}

### 6.8. Rename LVM

Đổi tên Volume Group (VG):

```bash
vgrename {VG_cũ} {VG_mới}
```

Đổi tên Logical Volume (LV):

```bash
lvrename {VG} {LV_cũ} {LV_mới}
```

Reboot lại server, nhấn giữ Shift để vào màn hình sau, rồi nhấn `e` để edit.

<figure><img src=".gitbook/assets/6_8_boot_option.png" alt=""><figcaption></figcaption></figure>

Chỉnh sửa lại đường dẫn mục `root=` thành tên LVM mới.

<figure><img src=".gitbook/assets/6_8_rename_root_path.png" alt=""><figcaption></figcaption></figure>

Sau đó `Ctrl+X` để lưu và boot lại hệ thống.

Login xong chạy 2 lệnh sau để update hệ thống:

```bash
update-initramfs -u -k all
update-grub
```

### 6.9. Extend Swap

{% stepper %}
{% step %}
#### Tắt phân vùng swap LVM

```bash
sudo swapoff -v /dev/ubuntu-vg/lv-swap
```
{% endstep %}

{% step %}
#### Kiểm tra swap đã tắt

```bash
swapon –show
```
{% endstep %}

{% step %}
#### Tăng dung lượng LVM

Tăng dung lượng LVM như bình thường.
{% endstep %}

{% step %}
#### Tạo lại chữ ký swap và bật swap

```bash
sudo mkswap /dev/ubuntu-vg/lv-swap
sudo swapon -v /dev/ubuntu-vg/lv-swap
```
{% endstep %}
{% endstepper %}

### 6.10. LUKS Setup

{% stepper %}
{% step %}
#### Cài đặt

```bash
sudo apt update
sudo apt install cryptsetup -y
```
{% endstep %}

{% step %}
#### Tạo LUKS trên ổ sdb

```bash
sudo cryptsetup luksFormat /dev/sdb
```

Xác nhận: `YES` rồi đặt mật khẩu.
{% endstep %}

{% step %}
#### Thêm mật khẩu dự phòng

```bash
sudo cryptsetup luksAddKey /dev/sdb
```

* Chỉ dùng sau khi ổ đã là LUKS.
* Không xóa dữ liệu.
* Thêm một passphrase mới vào key slot khác.
* Khi chạy sẽ yêu cầu nhập mật khẩu hiện tại để xác thực.
{% endstep %}

{% step %}
#### Mở ổ LUKS

```bash
sudo cryptsetup open /dev/sdb luks1
```

Sẽ tự tạo: `/dev/mapper/luks1`.
{% endstep %}

{% step %}
#### Tạo filesystem

```bash
sudo mkfs.xfs /dev/mapper/luks1
```
{% endstep %}

{% step %}
#### Mount

```bash
echo "UUID=$(blkid -s UUID -o value /dev/sdb1/luks1) /data xfs defaults,nofail,x-systemd.automount 0 2 " >> /etc/fstab
```
{% endstep %}
{% endstepper %}

Kiểm tra có bao nhiêu key slot:

```bash
sudo cryptsetup luksDump /dev/sdb
```

Xóa mật khẩu cũ:

```bash
sudo cryptsetup luksRemoveKey /dev/sdc
```

Đổi mật khẩu:

```bash
sudo cryptsetup luksChangeKey /dev/sdc
```

Mở rộng ổ LUKS:

```bash
cryptsetup resize crypt_data
```

### 6.11. Check ISCSI disk

```bash
sudo lsscsi
```

## 7. Kernel

### 7.1. Setup Kernel Defaults Ubuntu

Kiểm tra các kernel hiện có trên máy:

```bash
grep menuentry /boot/grub/grub.cfg
```

Check kernel hiện tại:

```bash
uname -r
```

Sửa file config GRUB để set cố định kernel muốn sử dụng:

```bash
sudo nano /etc/default/grub
```

Sửa dòng sau:

```
GRUB_DEFAULT="Advanced options for Ubuntu>Kernel_name"
```

Lệnh set defaults:

```bash
grubby --set-default /boot/….
```

Check kernel defaults:

```bash
grubby --default-kernel
```

Cập nhật GRUB:

```bash
sudo update-grub
```

### 7.2. Phá pass root Ubuntu

{% stepper %}
{% step %}
#### Mở tham số GRUB

Reboot và nhấn giữ Shift khi bắt đầu khởi động. Đến màn hình chọn kernel thì nhấn phím **"e"** để mở các tham số GRUB cần chỉnh sửa.

<figure><img src=".gitbook/assets/7_2_boot_option.jpg" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
Sử dụng các phím mũi tên và cuộn xuống dòng cuối cùng bắt đầu bằng từ khóa `Linux/boot/vmlinuz`.

<figure><img src=".gitbook/assets/7_2_find_option_boot.jpg" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
Thay thế `ro quiet splash $vt_handoff` bằng `rw init=/bin/bash`.

<figure><img src=".gitbook/assets/7_2_change_boot_path.jpg" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
#### Khởi động vào bash shell

Gõ `Ctrl + X` để khởi động lại hệ thống, chạy lệnh sau để kiểm tra xem hệ thống file gốc đã được mount đúng cách chưa:

```bash
mount | grep -w /
```
{% endstep %}

{% step %}
#### Thay đổi mật khẩu root

Thay đổi mật khẩu của root như bình thường.
{% endstep %}
{% endstepper %}

### 7.3. Phá pass root RHEL/Oracle

{% stepper %}
{% step %}
#### Mở tham số GRUB

Reboot và nhấn giữ Shift khi bắt đầu khởi động. Đến màn hình chọn kernel thì nhấn phím **"e"** để mở các tham số GRUB cần chỉnh sửa.

<figure><img src=".gitbook/assets/7_3_boot_option_oracle.png" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
#### Thêm tham số rd.break

Tìm dòng bắt đầu bằng `kernel=` và thêm tham số `rd.break` cuối dòng, sau đó nhấn `Ctrl + X` để lưu.

<figure><img src=".gitbook/assets/7_3_change_boot_option_oracle.png" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
#### Mount sysroot với quyền rw

```bash
mount -o remount,rw /sysroot/
mount | grep sysroot
```
{% endstep %}

{% step %}
#### Vào hệ thống file gốc

```bash
chroot /sysroot
```
{% endstep %}

{% step %}
#### Thay đổi mật khẩu root

Chạy lệnh `passwd` để thay đổi mật khẩu cho account root.
{% endstep %}

{% step %}
#### Gán nhãn SELinux và thoát

Dán nhãn các tệp SELinux, sau đó thoát ra bằng lệnh `exit` rồi logout để có thể truy cập bằng pass mới.

```bash
touch /.autorelabel
exit
logout
```
{% endstep %}
{% endstepper %}

## 8. Cài đặt package

### 8.1. Oracle

#### Postgres

{% stepper %}
{% step %}
#### Update hệ thống

```bash
sudo dnf update -y
```
{% endstep %}

{% step %}
#### Thêm repo

```bash
sudo dnf install -y <https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86%5F64/pgdg-redhat-repo-latest.noarch.rpm>
```
{% endstep %}

{% step %}
#### Disable Module mặc định

```bash
sudo dnf -qy module disable postgresql
```
{% endstep %}

{% step %}
#### Check repo hiện có

```bash
dnf repolist | grep pgdg
```
{% endstep %}

{% step %}
#### Cài Postgres 18

```bash
sudo dnf install -y postgresql18-server postgresql18
```
{% endstep %}

{% step %}
#### Khởi tạo DB

```bash
sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
```
{% endstep %}

{% step %}
#### Start và enable dịch vụ

```bash
sudo systemctl enable postgresql-18
sudo systemctl start postgresql-18
sudo systemctl status postgresql-18
```
{% endstep %}
{% endstepper %}

Để config cho Postgres thì nằm ở `/var/lib/pgsql/18/data`.

#### Chuyển nơi lưu database

{% stepper %}
{% step %}
#### Dừng dịch vụ

```bash
systemctl stop postgresql-18
```
{% endstep %}

{% step %}
#### Tạo thư mục lưu trữ mới

```bash
mkdir -p /data/postgresql/18/data
```
{% endstep %}

{% step %}
#### Đổi đường dẫn

```bash
nano /var/lib/pgsql/18/data/postgresql.conf
```

```ini
data_directory = '/data/postgresql/18/data'
```
{% endstep %}

{% step %}
#### Rsync dữ liệu

```bash
rsync -avHAX --progress /var/lib/pgsql/18/data/ /data/postgresql/18/data/
```
{% endstep %}

{% step %}
#### Gán quyền

```bash
chown -R postgres:postgres /data/postgresql
chmod 700 /data/postgresql/18/data
```
{% endstep %}

{% step %}
#### Khởi động lại dịch vụ

```bash
systemctl daemon-reload
systemctl start postgresql-18
```
{% endstep %}

{% step %}
#### Kiểm tra lại đường dẫn

```bash
sudo -u postgres psql -c "show data_directory;"
```
{% endstep %}
{% endstepper %}

#### Cấu hình Master – Slave

**Master**

Khởi tạo DB trên Master.

Cấu hình Master:

```bash
nano /var/lib/pgsql/18/data/postgresql.conf
```

```ini
listen_addresses='*'
wal_level=replica
max_wal_senders=10
max_replication_slots=10
hot_standby=on
wal_keep_size=1024MB
archive_mode=on
archive_command='cp %p /pgarchive/%f'
```

Tạo thư mục archive:

```bash
mkdir -p /var/lib/psql/18/main/archive
chown postgres:postgres /var/lib/psql/18/main/archive
```

Cho phép replication:

```bash
nano vi /var/lib/pgsql/18/data/pg_hba.conf
```

```
host replication replicator 0.0.0.0/0 scram-sha-256
```

Tạo user replication:

```bash
sudo -iu postgres
psql
```

```sql
CREATE ROLE replicator
WITH REPLICATION
LOGIN
PASSWORD 'YourPassword';
```

Trở về root, khởi động dịch vụ trên master:

```bash
systemctl enable postgresql-18
systemctl restart postgresql-18
```

Mở firewall:

```bash
firewall-cmd --permanent --add-port=5432/tcp
firewall-cmd –reload
```

**Slave**

Dừng service và xóa data cũ:

```bash
systemctl stop postgresql-18
rm -rf /var/lib/pgsql/18/data/*
```

Chuyển sang user postgres để đồng bộ dữ liệu từ master:

```bash
su - postgres

pg_basebackup -h IP_Master -p 5432 -U replicator -D /var/lib/pgsql/18/data -P -R -X stream -C -S slave
```

Kiểm tra file recovery:

```bash
cat /var/lib/pgsql/18/data/postgresql.auto.conf
```

Phải có như sau:

```ini
primary_conninfo='host=IP_Master port=5432 user=replicator password=StrongPassword'
primary_slot_name='slave'
```

Khởi động standby:

```bash
systemctl enable postgresql-18
systemctl start postgresql-18
```

Kiểm tra trạng thái trên Master:

```bash
sudo -iu postgres psql -c "
SELECT application_name, client_addr, state, sync_state, write_lsn, flush_lsn, replay_lsn
FROM pg_stat_replication;"
```

Hiển thị như sau:

```
application_name | client_addr | state | sync_state | write_lsn | flush_lsn | replay_lsn
------------------+---------------+-----------+------------+------------+------------+------------
walreceiver | 10.100.53.115 | streaming | async | 0/8E013050 | 0/8E013050 | 0/8E013050 (1 row)
```

#### Docker

```bash
sudo dnf update -y

sudo dnf config-manager --add-repo <https://download.docker.com/linux/centos/docker-ce.repo>

sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
sudo systemctl start docker
```

### 8.2. Ubuntu

#### Cài driver NVDIA

{% stepper %}
{% step %}
#### Update và cài dependency

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential dkms linux-headers-$(uname -r)
```
{% endstep %}

{% step %}
#### Disable nouveau

```bash
echo -e "blacklist nouveau\noptions nouveau modeset=0" | sudo tee /etc/modprobe.d/blacklist-nouveau.conf

sudo update-initramfs -u
sudo reboot
```

* Nouveau là driver open-source mặc định → không hỗ trợ CUDA.
* Phải disable để kernel load module NVIDIA proprietary.
{% endstep %}

{% step %}
#### Kiểm tra driver đề xuất

```bash
ubuntu-drivers devices
```
{% endstep %}

{% step %}
#### Cài auto driver phù hợp

```bash
sudo ubuntu-drivers autoinstall
```

Hoặc cài thủ công:

```bash
sudo apt install nvidia-driver-570
```
{% endstep %}

{% step %}
#### Check driver đã nhận

```bash
nvidia-smi
```
{% endstep %}
{% endstepper %}

#### Postgres

{% stepper %}
{% step %}
#### Cập nhật hệ thống

```bash
sudo apt update
sudo apt upgrade -y
```
{% endstep %}

{% step %}
#### Thêm key

```bash
sudo install -d /usr/share/postgresql-common/pgdg

sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
```
{% endstep %}

{% step %}
#### Thêm repo

```bash
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
```
{% endstep %}

{% step %}
#### Update lại và xem version khả dụng

```bash
sudo apt update
apt search postgresql-
```
{% endstep %}

{% step %}
#### Cài Postgres

Cài theo version:

```bash
sudo apt install postgresql-17 postgresql-client-17 -y
```

Hoặc cài version mặc định mới nhất:

```bash
sudo apt install postgresql -y
```
{% endstep %}

{% step %}
#### Kiểm tra cluster

```bash
pg_lsclusters
```
{% endstep %}
{% endstepper %}

Nếu cần gỡ repo:

```bash
sudo rm -f /etc/apt/sources.list.d/pgdg.list
sudo rm -f /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
sudo apt update
```

#### Docker

Nếu cài bằng Repo của Ubuntu:

```bash
apt install docker.io
```

Cài qua Docker Official Repository:

{% stepper %}
{% step %}
#### Cài dependency

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
```
{% endstep %}

{% step %}
#### Thêm Docker GPG key

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```
{% endstep %}

{% step %}
#### Thêm Docker repository

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```
{% endstep %}

{% step %}
#### Update package list

```bash
sudo apt update
```
{% endstep %}

{% step %}
#### Kiểm tra version trong repo

```bash
apt list --all-versions docker-ce 2>/dev/null
```
{% endstep %}

{% step %}
#### Cài version hiện tại của repo

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
{% endstep %}

{% step %}
#### Cài version chỉ định

```bash
VERSION_STRING='5:29.7.2-1~ubuntu.24.04~noble'

sudo apt install -y \
 docker-ce=${VERSION_STRING} \
 docker-ce-cli=${VERSION_STRING} \
 containerd.io \
 docker-buildx-plugin \
 docker-compose-plugin
```
{% endstep %}

{% step %}
#### Enable và kiểm tra Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
docker -v
systemctl status docker
```
{% endstep %}
{% endstepper %}

#### Ansible

{% stepper %}
{% step %}
#### Cài software-properties-common

```bash
sudo apt update
sudo apt -y install software-properties-common
```
{% endstep %}

{% step %}
#### Thêm PPA chính thức của Ansible

```bash
sudo apt-add-repository ppa:ansible/ansible
```

Bấm `ENTER` khi được yêu cầu chấp nhận bổ sung PPA.
{% endstep %}

{% step %}
#### Cài Ansible

```bash
sudo apt update
sudo apt -y install ansible
```
{% endstep %}

{% step %}
#### Kiểm tra phiên bản

```bash
ansible --version
```
{% endstep %}

{% step %}
#### Tạo user ansible để quản trị

```bash
useradd -m -s /bin/bash ansible
usermod -a -G sudo ansible
passwd ansible
```
{% endstep %}

{% step %}
#### Tạo SSH key trên Ansible server

```bash
su ansible
ssh-keygen -t rsa -b 4096
```
{% endstep %}

{% step %}
#### Copy SSH key sang các server cần quản trị

```bash
ssh-copy-id user@server-ip
```
{% endstep %}
{% endstepper %}

Cấu trúc dự án Ansible:

```
/home/ansible/
├── ansible.cfg
├── inventory
├── playbooks/
├── roles/
├── files/
└── templates/
```

**ansible.cfg**

File cấu hình của Ansible:

```ini
[defaults]
inventory=/home/ansible/inventory
host_key_checking=False
forks=20
timeout=30
```

Chức năng:

* Chỉ định inventory mặc định.
* Số lượng host xử lý song song.
* Timeout SSH.
* Các tùy chọn chung.
* Ansible sẽ đọc file này mỗi khi chạy.

**inventory**

Danh sách thiết bị cần quản lý:

```ini
[ubuntu]
10.7.106.232 ansible_user=root

[zabbix]
10.7.106.233 ansible_user=root

[cisco_switch]
10.0.100.11
```

Chức năng:

* Quản lý nhóm server.
* Khai báo user SSH.
* Khai báo biến cho host hoặc group.
* Đây là nơi Ansible biết phải SSH vào đâu.

**playbooks/**

Chứa các playbook YAML:

```
playbooks/
├── update_linux.yml
├── install_docker.yml
├── backup_cisco.yml
└── deploy_zabbix_agent.yml
```

Ví dụ file:

```yaml
---
- hosts: ubuntu
  tasks:
    - apt:
        update_cache: yes
```

Chức năng:

* Là nơi chứa các công việc cần thực hiện.
* Đây là thứ bạn chạy bằng:

```bash
ansible-playbook playbooks/update_linux.yml
```

**roles/**

Dùng để đóng gói các tác vụ thành module tái sử dụng.

```
roles/
└── docker/
    ├── tasks
    ├── files
    ├── templates
    └── defaults
```

Thay vì viết ở 10 playbook khác nhau:

* Cài Docker.
* Cấu hình Docker.
* Start Docker.

Tạo role `docker`, sau đó gọi:

```yaml
---
- hosts: ubuntu
  roles:
    - docker
```

Vai trò:

* Tái sử dụng.
* Chuẩn hóa triển khai.
* Dễ bảo trì.
* Khi hệ thống có vài chục playbook trở lên thì role gần như bắt buộc.

**files/**

Chứa file tĩnh cần copy lên server:

```
files/
├── nginx.conf
├── zabbix_agent.conf
└── motd.txt
```

Playbook:

```yaml
- copy:
    src: files/nginx.conf
    dest: /etc/nginx/nginx.conf
```

Ansible sẽ lấy file từ đây và đẩy lên server.

**templates/**

Chứa file mẫu sử dụng Jinja2:

```
templates/
└── nginx.conf.j2
```

Nội dung:

```nginx
server {
 listen 80;
 server_name {{ domain_name }};
}
```

Playbook:

```yaml
- template:
    src: templates/nginx.conf.j2
    dest: /etc/nginx/nginx.conf
```

Nếu:

```yaml
domain_name: owncloud.company.local
```

Thì file sinh ra trên server sẽ là:

```nginx
server {
 listen 80;
 server_name owncloud.company.local;
}
```

Khác với `files/`:

* `files/` copy nguyên xi.
* `templates/` sinh file động theo biến.

### 8.3. Alma Linux 9.8

#### XRDP

{% stepper %}
{% step %}
#### Cài đặt XRDP

```bash
dnf install epel-release -y
dnf install xrdp -y
systemctl enable --now xrdp
```
{% endstep %}

{% step %}
#### Mở firewall

```bash
sudo firewall-cmd --permanent --add-port=3389/tcp
sudo firewall-cmd –reload
```
{% endstep %}

{% step %}
#### Check các phiên đang chạy

```bash
loginctl list-sessions
```
{% endstep %}

{% step %}
#### Ngắt phiên của user

```bash
pkill -u user
```
{% endstep %}
{% endstepper %}

#### Tạo script ngắt phiên user

```bash
nano /usr/local/bin/xrdp-kill-idle.sh
```

```bash
#!/bin/bash

IDLE_LIMIT=14400

for session in $(loginctl list-sessions --no-legend | awk '{print $1}')
do
 USER=$(loginctl show-session "$session" -p Name --value 2>/dev/null)
 SERVICE=$(loginctl show-session "$session" -p Service --value 2>/dev/null)
 TYPE=$(loginctl show-session "$session" -p Type --value 2>/dev/null)
 REMOTE=$(loginctl show-session "$session" -p Remote --value 2>/dev/null)
 IDLE=$(loginctl show-session "$session" -p IdleHint --value 2>/dev/null)

 # Only XRDP session
 if [ "$SERVICE" != "xrdp-sesman" ]; then
 continue
 fi

 if [ "$TYPE" != "x11" ]; then
 continue
 fi

 if [ "$REMOTE" != "yes" ]; then
 continue
 fi

 if [ "$IDLE" != "yes" ]; then
 continue
 fi

 IDLE_US=$(loginctl show-session "$session" -p IdleSinceHintMonotonic --value)
 UPTIME_US=$(awk '{print $1*1000000}' /proc/uptime)

 IDLE_SEC=$(( (UPTIME_US - IDLE_US) / 1000000 ))

 if [ "$IDLE_SEC" -ge "$IDLE_LIMIT" ]; then
 loginctl terminate-session "$session"
 fi
done
```

Cấp quyền thực thi:

```bash
chmod +x /usr/local/bin/xrdp-kill-idle.sh
```

Tạo cronjob:

```bash
crontab -e
```

```cron
*/5 * * * * /usr/local/bin/xrdp-kill-idle.sh
```

Sau mỗi 5 phút script sẽ chạy 1 lần, xác định các phiên có trạng thái idle là `yes` và thời gian hơn `14400s` – `240p` sẽ kill phiên đó.

**Cấu hình Blank Screen cho toàn bộ user**

Tạo thư mục policy dconf:

```bash
mkdir -p /etc/dconf/db/local.d
```

Tạo file cấu hình:

```bash
vi /etc/dconf/db/local.d/00-screen-idle
```

```ini
[org/gnome/desktop/session]
idle-delay=uint32 300

[org/gnome/desktop/screensaver]
lock-enabled=false
```

* `idle-delay=300` → 300 giây = 5 phút.
* `lock-enabled=false` → không khóa màn hình.

Sửa policy:

```bash
vi /etc/dconf/db/local.d/locks/screensaver
```

```
/org/gnome/desktop/session/idle-delay
/org/gnome/desktop/screensaver/lock-enabled
```

Update dconf:

```bash
dconf update
```

#### Dbevear

```bash
wget <https://dbeaver.io/files/dbeaver-ce-latest-stable.x86%5F64.rpm>

sudo dnf install ./dbeaver-ce-latest-stable.x86_64.rpm -y

sudo dnf install dbeaver-*.rpm -y
```

#### Chrome

```bash
cat > /etc/yum.repos.d/google-chrome.repo << 'EOF'
[google-chrome]
name=google-chrome
baseurl=https://dl.google.com/linux/chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
EOF

dnf install -y google-chrome-stable
```

#### Remina – Thay Mobarxterm

```bash
sudo dnf install remmina -y
```

#### Dell Storage Manager

{% stepper %}
{% step %}
#### Tải file zip từ hãng về

```bash
cd /tmp

wget --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" <https://dl.dell.com/FOLDER13772130M/1/DellEMCStorageClientLinux-20.1.22.28.zip>
```
{% endstep %}

{% step %}
#### Giải nén file cài

```bash
sudo dnf install -y unzip

unzip DellEMCStorageClientLinux-20.1.22.28.zip -d DellEMCStorageClient

sudo dnf install DellEMCStorageClient/Storage\ Manager\ Linux\ Client\ 20.1.22.28.rpm
```
{% endstep %}

{% step %}
#### Tạo shortcut

```bash
sudo tee /usr/share/applications/dell-storage-manager.desktop >/dev/null <<EOF
[Desktop Entry]
Version=1.0
Name=Dell Storage Manager
Comment=Dell Storage Manager Client
Exec=env _JAVA_OPTIONS="-Dsun.java2d.opengl=false -Dsun.java2d.xrender=false" LIBGL_ALWAYS_SOFTWARE=1 /var/lib/dell/bin/Client
Icon=/var/lib/dell/icon.png
Terminal=false
Type=Application
Categories=System;
EOF
```
{% endstep %}
{% endstepper %}

#### Postman

{% stepper %}
{% step %}
#### Tải file nén

```bash
cd /tmp

wget https://dl.pstmn.io/download/version/9.31.30/linux64 -O postman.tar.gz
```
{% endstep %}

{% step %}
#### Giải nén vào thư mục /opt

```bash
sudo tar -xvzf postman-linux-x64.tar.gz -C /opt
```
{% endstep %}

{% step %}
#### Tạo liên kết để mở Postman từ terminal

```bash
sudo ln -s /opt/Postman/Postman /usr/bin/postman
```
{% endstep %}

{% step %}
#### Tạo Shortcut cho ứng dụng

```bash
sudo tee /usr/share/applications/Postman.desktop >/dev/null <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Postman
Comment=API Development Environment
Exec=/opt/Postman/Postman
Icon=/opt/Postman/app/resources/app/assets/icon.png
Terminal=false
Categories=Development;
StartupNotify=true
EOF
```
{% endstep %}
{% endstepper %}

#### Filezilla – Thay WinSCP

```bash
sudo dnf install filezilla -y
```

#### Geany – Thay Notepadd++

```bash
sudo dnf install geany
```

### 8.4. Đóng gói package cài offline

{% stepper %}
{% step %}
#### Cài công cụ tải dependency

```bash
sudo dnf install -y dnf-plugins-core createrepo_c
```
{% endstep %}

{% step %}
#### Download package qua DNF

```bash
dnf download --resolve --alldeps --destdir=/SoftwareJump/rpms remmina
```
{% endstep %}

{% step %}
#### Tải bộ cài từ web

```bash
wget {URL} -O /SoftwareJump/packages/{NAME_FILE}.rpm
```
{% endstep %}

{% step %}
#### Kiểm tra version

```bash
rpm -qp {NAME}
```
{% endstep %}

{% step %}
#### Tạo repo

```bash
createrepo /SoftwareJump/rpms
```

Sẽ sinh ra `repodata`.

Đây là metadata, dnf sẽ đọc metadata này. Nếu không có dnf sẽ không biết package nào tồn tại.

Khi thêm phần mềm mới:

```bash
createrepo --update /SoftwareJump/rpms
```
{% endstep %}

{% step %}
#### Tạo checksum

```bash
cd /SoftwareJump

find . -type f ! -path "./rpms/repodata/*" ! -name "SHA256SUMS" -exec sha256sum {} \; > SHA256SUMS
```
{% endstep %}
{% endstepper %}

Khi dùng trên một máy khác cần khai báo repo:

```bash
sudo tee /etc/yum.repos.d/local.repo >/dev/null <<EOF
[softwarejump]
name=SoftwareJump
baseurl=file:///opt/SoftwareJump/rpms
enabled=1
gpgcheck=0
EOF

dnf clean all
dnf makecache
```

Khi cài lại:

```bash
dnf install …
dnf install …rpm
tar -xzf …tar.gz
```

Kiểm tra checksum:

```bash
sha256sum -c SHA256SUMS
```

## 9. Firewall

### 9.1. Ubuntu

#### Bật/tắt firewall

```bash
sudo ufw enable
sudo ufw disable
```

#### Kiểm tra trạng thái

```bash
sudo ufw status
```

#### Lệnh theo port

```bash
sudo ufw allow/deny [số_cổng]
```

#### Cho phép một dải cụ thể

```bash
sudo ufw allow from [địa_chỉ_IP]
```

#### Cho phép một dải truy cập đến một port cụ thể

```bash
sudo ufw allow from 192.168.1.0/24 to any port 22
```

#### Xem danh sách quy tắc hiện có

```bash
sudo ufw status numbered
```

#### Xóa rule

```bash
sudo ufw delete [số_thứ_tự]
```

### 9.2. Oracle

Kiểm tra trạng thái firewall:

```bash
systemctl status firewalld
```

Thêm rule firewall:

```bash
sudo firewall-cmd --add-port=22/tcp --permanent
```

Xem các rule đang có:

```bash
sudo firewall-cmd --list-all
```

Reload firewall:

```bash
sudo firewall-cmd –reload
```

## 10. Systemd

`systemd` là trình quản lý dịch vụ (Service Manager) của Linux.

Nó chịu trách nhiệm:

* Khởi động hệ thống.
* Quản lý service.
* Restart service khi lỗi.
* Ghi log.
* Quản lý dependency.
* Tự khởi động khi boot.

Service được định nghĩa bằng các file:

```
/usr/lib/systemd/system/
```

hoặc:

```
/etc/systemd/system/
```

Thông thường `/etc/systemd/system` dùng cho service do người quản trị tự tạo.

### 10.1. Tạo service

Cấu trúc một service.

Tên file:

```
/etc/systemd/system/myapp.service
```

Nội dung:

```ini
[Unit]
Description=PostgreSQL 18 Database Server
After=network.target

[Service]
Type=notify
User=postgres
Group=postgres
Environment=PGDATA=/pgdatabase/data
ExecStart=/usr/pgsql-18/bin/postgres -D ${PGDATA}
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutSec=0
Restart=on-failure
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Sau khi tạo xong service cần chạy `systemctl daemon-reload` để yêu cầu systemd đọc lại toàn bộ các file cấu hình.

#### `[Unit]` – Mô tả service

Ví dụ:

```ini
[Unit]
Description=My Application
Documentation=https://abc.com
After=network.target
Requires=network.target
```

Các tham số:

*   `Description`: Mô tả tên của service, được hiển thị khi kiểm tra trạng thái bằng lệnh `systemctl status`.

    ```ini
    Description=PostgreSQL Database
    ```
*   `Documentation`: Chỉ định đường dẫn đến tài liệu của service, URL hoặc file.

    ```ini
    Documentation=https://example.com
    ```
*   `After`: Quy định service sẽ chỉ được khởi động sau khi service hoặc target được chỉ định đã khởi động.

    ```ini
    After=network.target
    ```

    Nghĩa là service chỉ bắt đầu sau khi dịch vụ mạng đã sẵn sàng.
*   `Before`: Quy định service phải được khởi động trước service hoặc target được chỉ định.

    ```ini
    Before=httpd.service
    ```
*   `Requires`: Khai báo service phụ thuộc bắt buộc.

    ```ini
    Requires=network.target
    ```

    Nếu `network.target` không khởi động được thì service này cũng sẽ không được khởi động.
*   `Wants`: Khai báo service phụ thuộc không bắt buộc.

    ```ini
    Wants=network.target
    ```

    Nếu `network.target` không khởi động được thì service vẫn có thể được khởi động.

#### `[Service]` – Cấu hình hoạt động của service

```ini
[Service]
Type=simple
User=postgres
Group=postgres
WorkingDirectory=/pgdatabase
Environment=PGDATA=/pgdatabase/data
ExecStart=/usr/pgsql-18/bin/postgres -D ${PGDATA}
Restart=always
RestartSec=5
LimitNOFILE=65535
```

Các tham số:

* `Type`: Xác định cách systemd quản lý tiến trình của service.
  * `simple`: Service được xem là đã khởi động ngay sau khi thực thi lệnh `ExecStart`.
  * `forking`: Dùng cho các chương trình daemon tạo tiến trình con và chạy nền.
  * `oneshot`: Chạy một lần rồi kết thúc, thường dùng cho các script cấu hình hoặc khởi tạo.
  * `notify`: Service sẽ gửi tín hiệu `READY=1` đến systemd khi hoàn tất quá trình khởi động.
* `User`: Chỉ định user dùng để chạy service.
* `Group`: Chỉ định group dùng để chạy service.
* `WorkingDirectory`: Chỉ định thư mục làm việc trước khi thực hiện `ExecStart`.
*   `Environment`: Khai báo biến môi trường cho service.

    ```ini
    Environment=PGDATA=/pgdatabase/data
    ```
*   `EnvironmentFile`: Đọc các biến môi trường từ một file.

    ```ini
    EnvironmentFile=/etc/myapp.conf
    ```
*   `ExecStart`: Chỉ định lệnh dùng để khởi động service.

    ```ini
    ExecStart=/usr/pgsql-18/bin/postgres -D ${PGDATA}
    ```
*   `ExecStartPre`: Thực hiện lệnh trước khi chạy `ExecStart`. Nếu lệnh này trả về lỗi thì service sẽ không được khởi động.

    ```ini
    ExecStartPre=/usr/bin/mkdir -p /pgdatabase/data
    ```
*   `ExecStartPost`: Thực hiện lệnh sau khi `ExecStart` thành công.

    ```ini
    ExecStartPost=/bin/echo Service Started
    ```
*   `ExecReload`: Lệnh thực hiện khi chạy `systemctl reload <service>`.

    ```ini
    ExecReload=/bin/kill -HUP $MAINPID
    ```
*   `ExecStop`: Lệnh thực hiện khi dừng service.

    ```ini
    ExecStop=/bin/kill -SIGTERM $MAINPID
    ```
* `Restart`: Chính sách tự động khởi động lại service.
  * `no`: Không tự động khởi động lại.
  * `always`: Luôn khởi động lại khi service dừng.
  * `on-failure`: Chỉ khởi động lại khi service kết thúc do lỗi.
  * `on-abnormal`: Khởi động lại khi service bị crash hoặc kết thúc bất thường.
*   `RestartSec`: Thời gian chờ trước khi thực hiện khởi động lại service.

    ```ini
    RestartSec=5
    ```
*   `TimeoutStartSec`: Thời gian tối đa cho phép service khởi động.

    ```ini
    TimeoutStartSec=120
    ```
*   `TimeoutStopSec`: Thời gian tối đa chờ service dừng.

    ```ini
    TimeoutStopSec=60
    ```
*   `KillMode`: Quy định cách systemd kết thúc các tiến trình của service.

    ```ini
    KillMode=control-group
    ```
*   `PIDFile`: Chỉ định file chứa PID của tiến trình chính.

    ```ini
    PIDFile=/run/postgresql.pid
    ```
*   `LimitNOFILE`: Giới hạn số lượng file descriptor mà service được phép mở.

    ```ini
    LimitNOFILE=65535
    ```
* `LimitNPROC`: Giới hạn số lượng tiến trình mà service được phép tạo.
* `LimitMEMLOCK`: Giới hạn dung lượng bộ nhớ được phép khóa, thường dùng cho PostgreSQL, Oracle hoặc Elasticsearch.

#### `[Install]` – Cấu hình khởi động cùng hệ thống

```ini
[Install]
WantedBy=multi-user.target
```

Các tham số:

*   `WantedBy`: Xác định target mà service sẽ được liên kết đến khi thực hiện lệnh `systemctl enable <service>`.

    ```ini
    WantedBy=multi-user.target
    ```

    Khi chạy lệnh enable, systemd sẽ tạo symbolic link của service vào thư mục `/etc/systemd/system/multi-user.target.wants/`. Điều này giúp service tự động khởi động khi hệ thống vào chế độ multi-user, chế độ hoạt động thông thường của máy chủ.
*   `RequiredBy`: Tương tự `WantedBy` nhưng tạo mối quan hệ phụ thuộc bắt buộc. Nếu service này không khởi động được thì target hoặc service liên kết cũng sẽ không được khởi động.

    ```ini
    RequiredBy=myapp.target
    ```
*   `Alias`: Tạo tên gọi khác, bí danh, cho service. Sau khi enable, service có thể được quản lý bằng tên alias.

    ```ini
    Alias=db.service
    ```
*   `Also`: Chỉ định các service khác sẽ được enable hoặc disable cùng với service hiện tại.

    ```ini
    Also=myapp-helper.service
    ```

Nếu service không cần tự khởi động khi hệ thống boot thì có thể không khai báo phần `[Install]`. Khi đó service vẫn có thể được khởi động thủ công.

### 10.2. Cronjob
